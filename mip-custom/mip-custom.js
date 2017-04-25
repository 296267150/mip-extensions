/**
 * @file mip-custom 组件
 * @author
 */

define(function (require) {

    var $ = require('zepto');
    var util = require('util');
    var viewer = require('viewer');
    var templates = require('templates');
    var fetchJsonp = require('fetch-jsonp');
    var customElement = require('customElement').create();

    var regexs = {
        html: /<mip-\S*>(.*)<\/mip-\S*></,
        script: /<script[^>]*>(.*?)<\/script>/g,
        style: /<style[^>]*>(.*?)<\/style>/g,
        innerhtml: />([\S\s]*)<\//,
        customTag: /<(mip-\S+)>/,
        tagandAttr: /<(mip-[^>]*)>/,
        reghttp: /\/c\/(\S*)/,
        reghttps: /\/c\/s\/(\S*)/
    };

    var params = {
        lid: '',
        query: '',
        title: '',
        cuid: '',
        originUrl: getSubString(location.pathname, regexs.reghttps) || getSubString(location.pathname, regexs.reghttp)
    };

    var commonData = {};
    var template = {};

    /**
     * [extendObj 合并数据]
     *
     * @param  {Object} opt 默认数据对象
     * @param  {Object} ext 需要合并的数据对象
     * @return {Object}     合并后的数据对象
     */
    function extendObj(opt, ext) {

        for (var key in ext) {
            if (ext.hasOwnProperty(key)) {
                opt[key] = ext[key];
            }
        }

        return opt;
    }

    /**
     * [getHashparams mip连接特殊情况，从 hash 中获取参数
     *
     * @return {Object}     合并后的数据对象
     */
    function getHashparams() {

        for (var key in params) {
            if (params.hasOwnProperty(key)) {
                params[key] = MIP.hash.get(key) || params[key];
            }
        }

        return params;
    }

    /**
     * [getUrl url 拼接函数]
     *
     * @param  {string} src 获取的最初url
     * @return {string}     拼接后的url
     */
    function getUrl() {
        var self = this;
        var url = 'https://mipcache.bdstatic.com/custom?';

        for (var key in self.params) {
            if (self.params.hasOwnProperty(key)) {
                url += key + '=' + self.params[key] + '&';
            }
        }
        return url;
    }

    /**
     * [getSubString 根据正则获取子串]
     *
     * @param  {string}  str [截取钱字符串]
     * @param  {RegExp}  reg [正则表达式]
     * @param  {integer} pos [位置]
     * @return {string}      [截取后字符串]
     */
    function getSubString(str, reg, pos) {
        pos = pos ? 0 : 1;
        var res = str.match(reg) && str.match(reg)[pos] ? str.match(reg)[pos] : '';
        return res;
    }

    function set(str, reg, tag, attr, container) {
        // console.log(tag,attr,tag + '[' + attr + ']', container);

        var node = container.querySelector(tag + '[' + attr + ']') || document.createElement(tag);
        node.setAttribute(attr, '');
        var style = str.match(reg);
        style && style.forEach(function (tmp) {
            var r = new RegExp('<' + tag + '>([\\S\\s]*)</' + tag + '>');
            var innerhtml = tmp.match(r)[1];
            if (node.innerHTML.indexOf(innerhtml) === -1) {
                node.innerHTML += innerhtml;
            }
        });

        container.appendChild(node);
    }

    /**
     * [getXPath 获取 xpath 数组]
     *
     * @param  {DOM}   node [点击节点]
     * @param  {DOM}   wrap [容器]
     * @param  {Array} path [结果数组]
     * @return {Array}      [结果数组]
     */
    function getXPath(node, wrap, path) {
        path = path || [];
        wrap = wrap || document;
        if (node === wrap || !node || !wrap) {
            return path;
        }
        if (node.parentNode !== wrap) {
            path = getXPath(node.parentNode, wrap, path);
        }
        var count = 1;
        var sibling = node.previousSibling;
        while (sibling) {
            if (sibling.nodeType === 1 && sibling.nodeName === node.nodeName) {
                count++;
            }
            sibling = sibling.previousSibling;
        }
        if (node.nodeType === 1) {
            path.push(node.nodeName.toLowerCase() + (count > 1 ? count : ''));
        }
        return path;
    }

    /**
     * 构造元素，初次进入到视图区执行
     */
    customElement.prototype.build = function () {

        // if (!viewer.isIframe) {
        //     return;
        // }

        var self = this;
        var element = self.element;

        // 监听 a 标签点击事件
        util.event.delegate(element, 'a', 'click', function (event) {
            event && event.preventDefault();

            var xpath = '';
            var path = getXPath(this, element);

            path && path.forEach(function (val) {
                xpath += xpath ? '_' + val : val;
            });

            var clkInfo = {xpath: xpath};

            this.href += ((this.href[this.href.length - 1] === '&') ? '' : '&') + 'clk_info=' + JSON.stringify(clkInfo);
            console.log(this.href);
            // location.href = this.href;
            // $(this).click();

        });

        // 默认参数设置
        self.params = getHashparams();

        // 获取用户设置参数
        try {
            var script = element.querySelector('script[type="application/json"]');
            if (script) {
                self.params = extendObj(self.params, JSON.parse(script.textContent.toString()));
            }
        }
        catch (error_msg) {
            console.warn('json is illegal'); // eslint-disable-line
            console.warn(error_msg); // eslint-disable-line
            return;
        }

        self.url = getUrl.call(self);
        // self.url = 'http://cp01-aladdin-product-28.epc.baidu.com:8500/common?query=%E9%BA%BB%E7%83%A6&originalurl=xywy.com/fdsjifosdf/fjdsof&uid=12133&title=test';
        self.url = 'http://cp01-aladdin-product-28.epc.baidu.com:8500/common?query=%E9%BA%BB%E7%83%A6&originalurl=xywy.com/fdsjifosdf/fjdsof&accid=12133&title=test';
        // console.log(self.url);
        fetchJsonp(self.url, {
            jsonpCallback: 'cb'
        }).then(function (res) {
            return res.json();
        }).then(function (data) {
            console.log(data);
            if (data && data.errno) {
                console.error(data.errormsg);
                return;
            }
            if (data && data.data && data.data.common) {
                commonData = data.data.common;
            }
            if (data && data.data && data.data.template) {
                template = data.data.template;
            }

            for (var k = 0; k < template.length; k++) {
                var tplData = template[k];
                // console.log(tplData);
                var container = document.createElement('div');
                container.setAttribute('mip-custom-item', k);
                element.appendChild(container);
                // console.log(tplData);
                for (var i = 0; i < tplData.length; i++) {

                    var str = tplData[i].tpl ? decodeURIComponent(tplData[i].tpl): null;
                    if (!str) {
                        return;
                    }
                    var html = str.replace(regexs.script, '').replace(regexs.style, '');
                    // console.log(html);
                    var reg = new RegExp('\<([^\\s|\>]*)','g');
                    var customTag = reg.exec(html)[1];
                    // console.log(str, html, customTag);

                    // style 处理
                    set(str, regexs.style, 'style', 'mip-custom-css', document.head);

                    // html 处理
                    var tplId = customTag + '-' + Math.random().toString(36).slice(2);
                    var customNode = document.createElement(customTag);
                    var tag = getSubString(html, regexs.tagandAttr);
                    var tagArray = tag.split(' ');
                    for (var index = 0; index < tagArray.length; index++) {
                        var attrs = tagArray[index].split('=');
                        // console.log(attrs);
                        if (attrs[1]) {
                            customNode.setAttribute(attrs[0], attrs[1].replace(/"/ig, ''));
                        }
                    }
                    // console.log(tagArray);
                    // console.log(tag);

                    var tpl = document.createElement('template');

                    customNode.setAttribute('template', tplId);
                    customNode.appendChild(tpl);

                    tpl.setAttribute('type', 'mip-mustache');
                    tpl.id = tplId;
                    tpl.innerHTML = getSubString(html, regexs.innerhtml);
                    container.appendChild(customNode);

                    // 模板渲染
                    templates.render(customNode, tplData[i].tplData, true).then(function (res) {
                        res.element.innerHTML = res.html;
                        // console.log(res.html);

                        // script 处理
                        var timer = setTimeout(function () {
                            set(str, regexs.script, 'script', customTag, document.body);
                            clearTimeout(timer);
                        }, 0)
                    });
                }
            }
        });
    };

    return customElement;
});
