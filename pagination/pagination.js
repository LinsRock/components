/* 
2018.12.17【分页器】

*/
/** 
    Pagination参数含义
    element: 分页器元素的 id || className (必填)
    config：配置分页器的参数对象
        {
            pageCount：分页器总页数(必填)
            curPage: 当前页码，默认为第1页(选填)
            sideShow：当前页码两侧显示多少页，默认为2页(选填)
            endShow：首尾最少显示页码长度，默认为4页(选填)
            isHash：是否开启hash，默认关闭(选填)
            callBack：回调函数(选填)
        }
**/
var Pagination = function (element, config) {
    //参数配置
    this.options = {
        // 当前页码，默认为第1页
        curPage: config.curPage || 1,
        // 当前页码两侧显示多少页，默认为2页
        sideShow: config.sideShow || 2,
        // 是否开启hash，默认关闭
        isHash: config.isHash || false,
        // 分页器元素
        pageEle: this.$(element)[0],
        // 首尾最少显示页码长度（大于sideShow）,默认为4页
        endShow: config.endShow || 4,
        // 总页数
        pageCount: config.pageCount,
        // 回调函数
        callBack: config.callBack
    };
    // 渲染分页器
    this.renderPages();
    // 执行回调函数
    this.callBack();
    // 改变页码事件
    this.changePage();
};

Pagination.prototype = {
    constructor: Pagination,
    pageInfos: [
        {
            className: "page-prev",
            content: "上一页"
        },
        {
            className: "page-next",
            content: "下一页"
        },
        {
            className: "page-ellipsis",
            content: "..."
        }
    ],
    //模拟jQuery的 $()
    $: function(selector, context) {
        context = arguments.length > 1 ? context : document;
        return context ? context.querySelectorAll(selector) : null;
    },
    //渲染页数
    renderPages: function () {
        var fragment = document.createDocumentFragment(),
            curPage = this.options.curPage,
            pageCount = this.options.pageCount,
            sideShow = this.options.sideShow,
            endShow = this.options.endShow,
            self = this;
        self.options.pageEle.innerHTML = "";
        // 插入当前页码
        self.addFragmentAfter(fragment, [
            self.getPageInfo(curPage, "page-active")
        ]);
        // 插入sideShow页码
        for(var i = 1; i <= sideShow; i++) {
            if(curPage - i > 1) {
                self.addFragmentBefore(fragment, [
                    self.getPageInfo(curPage - i)
                ])
            }
            if(curPage + i < pageCount) {
                self.addFragmentAfter(fragment, [
                    self.getPageInfo(curPage + i)
                ])
            }
        }
        // 首端显示页码少于endShow时，补充插入
        if(curPage + sideShow < endShow && curPage + sideShow < pageCount) {
            for(var i = curPage + sideShow + 1; i <= endShow; i++) {
                self.addFragmentAfter(fragment, [
                    self.getPageInfo(i)
                ]);
            }
        }
        // 尾端显示页码少于endShow时，补充插入
        if(pageCount - (curPage - sideShow) + 1 < endShow && curPage - sideShow - 1 > 1) {
            for(var i = curPage - sideShow - 1; i > pageCount - endShow; i--) {
                self.addFragmentBefore(fragment, [
                    self.getPageInfo(i)
                ])
            }
        }
        // 插入前省略
        if(curPage - (sideShow + 1) > 1) {
            this.addFragmentBefore(fragment, [self.pageInfos[2]]);
        }
        // 插入首页和上一页
        if(curPage > 1) {
            this.addFragmentBefore(fragment, [
                self.pageInfos[0],
                self.getPageInfo(1)
            ]);
        }
        // 插入后省略
        if(curPage + (sideShow + 1) < pageCount) {
            this.addFragmentAfter(fragment, [self.pageInfos[2]])
        }
        // 插入尾页和下一页
        if(curPage < pageCount) {
            this.addFragmentAfter(fragment, [
                self.getPageInfo(pageCount),
                self.pageInfos[1]
            ]);
        }
        // 生成的Dom片段插入分页器元素
        self.options.pageEle.appendChild(fragment);
    },
    addFragmentBefore: function (fragment, datas) {
        fragment.insertBefore(this.createHtml(datas), fragment.firstChild);
    },
    addFragmentAfter: function (fragment, datas) {
        fragment.appendChild(this.createHtml(datas));
    },
    getPageInfo: function(content, newClassName) {
        return {
            className: newClassName ? "page " + newClassName : "page",
            content: content
        };
    },
    // 创建dom元素
    createHtml: function (eleDatas) {
        var fragment = document.createDocumentFragment(),
            oA = document.createElement('a'),
            oSpan = document.createElement('span'),
            cloneEle = null;
        eleDatas.forEach(function (item) {
                // 生成A标签
            if (item.className != "page-ellipsis") {    
                cloneEle = oA.cloneNode(false);
                cloneEle.setAttribute("href", "javascript:;");
            } else { 
                // 生成span标签   
                cloneEle = oSpan.cloneNode(false);
            }
            cloneEle.setAttribute("class", item.className);
            cloneEle.innerText = item.content;
            fragment.appendChild(cloneEle);
        });
        return fragment;
    },
    // 回调函数
    callBack: function () {
        this.options.callBack && this.options.callBack(this.options.curPage, this.options.pageCount);
    },
    // 给分页器添加点击事件
    changePage: function () {
        var self = this,
            pageEle = self.options.pageEle;
        self.addEvent(pageEle, "click", function(event) {
            var e = event || window.event,
                target = e.target || e.srcElement;
            //利用事件冒泡添加事件
            if(target.nodeName.toLocaleLowerCase() == "a") {
                if (target.classList.contains("page-prev")) {
                    self.prevPage();
                } else if (target.classList.contains("page-next")) {
                    self.nextPage();
                } else if (target.classList.contains("page")) {
                    self.goPage(parseInt(target.innerText));
                } else {
                    return;
                }
                self.renderPages();
                self.callBack();
                self.pageHash();
            }   
        });
    },
    addEvent: function(element, type, handler) {
        if (element.addEventListener) {
            //使用DOM2级方法添加事件
            element.addEventListener(type, handler, false);
        } else if (element.attachEvent) {
            //使用IE方法添加事件
            element.attachEvent("on" + type, handler);
        } else {
            //使用DOM0级方法添加事件
            element["on" + type] = handler;
        }
    },
    prevPage: function() {
        this.options.curPage--;
    },
    nextPage: function() {
        this.options.curPage++;
    },
    goPage: function(curPage) {
        this.options.curPage = curPage;
    },
    pageHash: function () {
        if(this.options.isHash) {
            window.location.hash = '#' + this.options.curPage;
        }
    }
};

