/**
 * @file mip-custom 组件
 * @author
 */

define(function (require) {

    var customElement = require('customElement').create();

    var templates = require('templates');
    var fetchJsonp = require('fetch-jsonp');

    var regexs = {
        html: /<mip-\S*>(.*)<\/mip-\S*></,
        script: /<script>([\S\s]*)<\/script>/,
        innerhtml: />([\S\s]*)<\//,
        customTag: /<\/(mip-\S*)>/,
        httppathname: /\/c\/(\S*)/,
        httpspathname: /\/c\/s\/(\S*)/
    };

    var params = {
        lid: "",
        query: "",
        title: document.head.querySelector("title").innerText,
        cuid: "",
        url: getSubString(location.pathname, regexs.httpspathname) || getSubString(location.pathname, regexs.httppathname)
    };

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
        var url = 'http://172.20.136.120:3000/mip-custom?tag=mip-rec&';

        for (var key in self.params) {
            if (self.params.hasOwnProperty(key)) {
                url += key + '=' + self.params[key] + '&';
            }
        }
        return url;
    }

    function getSubString(str, reg, pos) {
        pos = pos ? 0 : 1;
        var res = str.match(reg) && str.match(reg)[pos] ? str.match(reg)[pos] : '';
        return res;
    }

    /**
     * 构造元素，初次进入到视图区执行
     */
    customElement.prototype.firstInviewCallback = function () {
        // TODO
        var self = this;
        var element = self.element;

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

        fetchJsonp(self.url, {
            jsonpCallback: 'callback'
        }).then(function (res) {
            return res.json();
        }).then(function (data) {
            for (var i = 0; i < data.length; i++) {
                var str = decodeURIComponent(data[i].tpl);

                // script 处理
                var script = getSubString(str, regexs.script);
                var node = document.body.querySelector('script[mip-custom]') || document.createElement('script');
                node.setAttribute('type','text/javascript');
                node.setAttribute('mip-custom','');
                if (script !== node.innerHTML) {
                    node.innerHTML += script;
                }
                
                document.body.appendChild(node);


                // html 处理
                var html = getSubString(str, regexs.html, 1);
                html = html.substring(-1, html.length - 1);
                var customTag = getSubString(html, regexs.customTag);
                var tplId = customTag + '-' + Math.random().toString(36).slice(2);
                var customNode = document.createElement(customTag);
                var tpl = document.createElement('template');

                customNode.setAttribute('template', tplId);
                customNode.appendChild(tpl);

                tpl.setAttribute('type', 'mip-mustache');
                tpl.id = tplId;
                tpl.innerHTML = getSubString(html, regexs.innerhtml);
                element.appendChild(customNode);

                // 模板渲染
                templates.render(customNode, data[i].data).then(function (htmls) {
                    customNode.innerHTML += htmls;
                });

            }
        });

    };

    return customElement;
});
