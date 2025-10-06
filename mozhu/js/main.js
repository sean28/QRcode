// 强制伪造环境，防止跳转
rm.isLegalEnv = function () { return false; };
rm.login = function (cb) { cb && cb({ success: true, userInfo: { userid: 0, nickname: "Guest" } }); };
rm.request = function (cfg, cb) { cb && cb({ statusCode: 200, data: {} }); };
rm.navigateTo = function () { };

rm.ready(function () {
    rm.showMenus(["addHomeIcon"])
    if (rm.getEnv().platform === "iOS") {
        rm.setTextSelectEnable(true);
    } else {
        rm.config({
            pageAttr: {
                textSelectable: true,
                swipeBackEnable: true
            }
        })
    }
    if (rm.getEnv().platform === "iOS" || rm.getEnv().platform === "Android" || rm.getEnv().isNewHM) {
        document.getElementsByTagName("body")[0].classList.add("mobile");
        window._ismobile = true;
    } else {
        document.getElementsByTagName("body")[0].classList.add("desktop");
        window._ispc = true;
    }
    rm.bindNavigation();
});
var docElement = document.documentElement;
var docBody = document.body;
var windowHeight = docElement.clientHeight || docBody.clientHeight;
var windowWidth = docElement.clientWidth || docBody.clientWidth;
var apis = {
    myList: "http://gamecenter.ruanmei.com/json/user/{userid}.json",
    submit: "http://gamecenter.ruanmei.com/GameCenter/GameCenter.asmx/SubmitRank"
}
//http://img.ithome.com/app/magiclines/index.html?mtwidth=400&mtheight=765&mticon=https%3a%2f%2fimg.ithome.com%2fapp%2ftools%2frect%2fmozhu.png&ismp=true&hidemenu=1
var sound = {
    select: new Howl({ src: ['./sound/select.mp3'] }),
    // move: new Howl({ src: ['./sound/move.mp3'] }),
    bomb: new Howl({ src: ['./sound/bomb.wav'] }),
    great: new Howl({ src: ['./sound/congratulation.wav'] }),
    over: new Howl({ src: ['./sound/gameover.wav'] }),
    button: new Howl({ src: ['./sound/button.wav'] }),
}
var urlInfo = parseUrl(window.location.href);
new Vue({
    el: "#app",
    data: {
        windowHeight: 0,
        windowWidth: 0,
        user: null,
        scoreRank: {
            "P": 0,
            "A": 25432,
            "R": 0,
            "V": false,
            "SV": false,
            "DI": 0,
            "D": "",
            "PW": 0,
            "WR": 0,
            "PD": null
        },
        cells: [],
        balls: [],
        nextBallGroup: [],
        score: 0,
        ballWidth: 0,
        inited: false,
        bgPaused: true,
        soundClosed: false,
        statusBarHeight: rm.isLegalEnv() && urlInfo.params.fitsystemWindow === "1" ? 20 : 0,
        titleBarHeight: rm.isLegalEnv() && urlInfo.params.fitsystemWindow === "1" ? 56 : 0,
        secret: false,
        canContinue: false,
        marginTop: false,
        configKey: "magicLinesConfig3",
        modalShow: false,
        shareShow: false,
        srMode: false,
    },
    created: function () {
        var that = this;
        that.windowHeight = windowHeight;
        that.windowWidth = windowWidth;
        var isSoundClosed = localStorage && localStorage.getItem("mozhu-sound-closed");
        that.soundClosed = isSoundClosed === "1";
        var bgClosed = localStorage && localStorage.getItem("mozhu-bg-closed");
        if (bgClosed != null) {
            window.__userClosedBg = bgClosed === "1";
        }
        that.bgClosed = bgClosed === "1";
        that.srMode = localStorage && localStorage.getItem("sr-mode-enable") === "1";
        var env = rm.getEnv();
        /* 
        if (!env.isLegal) {
            window.location.href = "ithome://openurl?url=" + encodeURIComponent(getPageLink());
        } else {
            if(env.isWxmp){
                if(localStorage.getItem("magiclinesAccountip") !== "true"){
                    that.showModal(
                        {
                            content: "温馨提示<br><br>小程序中使用无法同步游戏成绩数据，如需同步成绩数据请使用独立客户端。",
                            cancelText: "不再提示",
                            confirmText: "知道了"
                        },
                        function (res) {
                            if (res.cancel) {
                                localStorage.setItem("magiclinesAccountip", "true") 
                            }
                        }
                    )
                }
            } else if (env.app === "ithome" && env.appver < 7.30) {
                that.showModal(
                    {
                        content: "重要提示<br><br>您的App版本过低，无法同步游戏成绩数据，请升级到最新版本以支持数据同步。",
                        cancelText: "忽略",
                        confirmText: "立即升级"
                    },
                    function (res) {
                        if (res.confirm) {
                            rm.showUpgradeTip();
                        }
                    }
                )
            }
        }
        */
        rm.ready(function () {
            rm.config({ pageAttr: { swipeBackEnable: false, safeAreaEnable: true, navBarColor: "#2b180e", useBlackNavBtn: false } })
            if (rm.isLegalEnv()) {
                rm.onBeforeClose(function(){
                    var body = document.getElementsByTagName("body")[0];
                    if(that.modalShow){
                        that._cancelModal();
                    } else if(that.shareShow){
                        that.closeSahre();
                    } else if(body.classList.contains("begin")){
                        body.classList.remove("begin");
                    } else if(body.classList.contains("setting")){
                        body.classList.remove("setting");
                    } else {
                        rm.closeWindow();
                    }
                    return true;
                })

                if (urlInfo.params.fitsystemWindow === "1") {
                    var isIOS = rm.getEnv().platform === "iOS";
                    that.statusBarHeight = rm.getSystemInfoSync().systemInfo.statusBarHeight || (isIOS ? 37 : 37);
                    that.titleBarHeight = rm.getSystemInfoSync().systemInfo.titleBarHeight || (isIOS ? 46 : 56);
                }
                getPageS(function (res) {
                    that.secret = res;
                })
                rm.getUserInfo(function (res) {
                    that.parseUserInfo(res);
                })
                rm.onPageVisibleChanged(function (status) {
                    if (!window.__userClosedBg) {
                        that.setPlayer("bg", status.show);
                    }
                })
                var shareInfo = {
                    title: "魔珠休闲小游戏 @IT之家",
                    desc: '经典的连珠消除游戏，风靡全球20年！单机、联网都能玩！',
                    url: window.location.href,
                    imgUrl: getAbsolutePath("imgs/poplines_screen.jpg"),
                };
                rm.shareConfig(
                    shareInfo,
                    function (res) {
                    }
                )
                rm.onEvent({ name: "it_tools", attr: { tool: "魔珠" } })
            }

            setTimeout(function () {
                if (!that.resumeGame()) {
                    that.resetGame()
                } else {
                    that.canContinue = true;
                }
                that.inited = true;
                that.resize("setTimeout");
                that.setPlayer("bg", !that.bgClosed);
            }, 300)

            var cells = [];
            var cellIndexList = [];
            [...Array(81).keys()].map(function (number) {
                cells.push({
                    index: number,
                    x: number % 9,
                    y: Math.floor(number / 9)
                })
                cellIndexList.push(number)
            })
            that.cells = cells;
            window._cellIndexList = cellIndexList;
            window._balls = [
                { name: "purple", selected: false, waitDelete: false },
                { name: "orange", selected: false, waitDelete: false },
                { name: "yellow", selected: false, waitDelete: false },
                { name: "blue", selected: false, waitDelete: false },
                { name: "green", selected: false, waitDelete: false },
                { name: "red", selected: false, waitDelete: false },
                { name: "fuchsia", selected: false, waitDelete: false },
            ]

            var bgPlayer = document.getElementById("player-bg");
            bgPlayer.addEventListener("play", function () {
                that.bgPaused = false;
            });
            bgPlayer.addEventListener("pause", function () {
                that.bgPaused = true;
            });
            window.onresize = function () {
                that.resize("window.onresize")
            }
        })


    },
    methods: {
        consume: function () {

        },
        switchSound: function () {
            this.soundClosed = !this.soundClosed;
            localStorage && localStorage.setItem("mozhu-sound-closed", this.soundClosed ? "1" : "0")
            this.setPlayer("button", true);
        },
        resize: function (param) {
            console.log("resize", param)
            windowHeight = docElement.clientHeight || docBody.clientHeight;
            windowWidth = docElement.clientWidth || docBody.clientWidth;
            this.windowHeight = windowHeight;
            this.windowWidth = windowWidth;
            var ratio = windowWidth * 1.0 / windowHeight;
            var isLand = ratio > 0.75;
            // 棋盘垂直居中
            if (isLand && windowWidth > 500) {
                windowWidth = 500;
            }
            var needHeight = Math.min(1.5 * windowWidth, windowHeight - 30);
            var needWidth = needHeight * 1.0 / 1.495;

            this.marginTop = (windowHeight - needHeight) / 2;
            document.getElementById("app").style.width = needWidth + "px";
            document.getElementById("app").style.minHeight = window.innerHeight + "px";
            document.getElementsByTagName("body")[0].classList[isLand ? "add" : "remove"]("land");

            // 计算棋盘内小球、方格等元素尺寸
            var pannel = document.getElementsByClassName("cells-list")[0];
            pannel.style.height = (pannel.clientWidth) + "px";
            this.ballWidth = pannel.clientWidth * 0.11111111;
            var ballPannel = document.getElementsByClassName("balls-list")[0];
            ballPannel.style.height = (ballPannel.clientWidth) + "px";

            console.log("marginTop", this.marginTop)
        },

        exitSettings: function () {
            document.getElementsByTagName("body")[0].classList.remove("setting");
            this.setPlayer("button", true);
        },
        openSettings: function () {
            document.getElementsByTagName("body")[0].classList.add("setting");
            this.setPlayer("button", true);
        },

        continueGame: function () {
            this.setPlayer("button", true);
            if (!window.__userClosedBg) {
                this.setPlayer("bg", true)
            }
            document.getElementsByTagName("body")[0].classList.add("begin");
        },

        newGame: function (requestLogin) {
            var that = this;
            if (requestLogin && rm.isLegalEnv()) {
                that.login()
            }
            document.getElementsByTagName("body")[0].classList.add("begin");
            this.deleteConfig();
            this.resetGame();
            if (!window.__userClosedBg) {
                that.setPlayer("bg", true)
            }
        },

        returnStart: function () {
            this.setPlayer("button", true);
            document.getElementsByTagName("body")[0].classList.remove("begin");
        },
        replayGame: function () {
            this.setPlayer("button", true);
            var that = this;
            if (rm.isLegalEnv()) {
                that.showModal(
                    {
                        content: '确认要重玩一局？',
                        cancelText: '继续',
                        showCancel: true,
                        confirmText: '重玩'
                    },
                    function (res) {
                        if (res.confirm) {
                            that.resetGame()
                        } else {
                            that.setPlayer("button", true)
                        }
                    }
                )
            } else {
                that.resetGame()
            }
        },
        resetGame: function () {
            this.setPlayer("button", true)
            this.balls = [];
            this.score = 0;
            window.__steps = 0;
            window.__startTime = new Date().getTime();
            var balls = [];
            while (true) {
                balls = this.getRandomBalls(5)
                var allSameColor = balls.findIndex(function (item) {
                    return item.name !== balls[0].name;
                }) === -1;
                if (!allSameColor) {
                    break;
                }
            }
            this.placeBalls(balls);

            this.nextBallGroup = this.getRandomBalls(3);
            window.__isProcessing = false;
        },
        clickCell: function (index) {
            if (window.__isProcessing) {
                return;
            }
            var currentTime = new Date().getTime()
            var lastClickTime = window.__lastClickTime || 0;
            if (Math.abs(currentTime - lastClickTime) < 300) {
                return;
            }
            window.__lastClickTime = currentTime;
            window.__isProcessing = true;
            var that = this;
            var selectedIndex = that.balls.findIndex(function (ball) {
                return ball.selected;
            })
            var targetBallIndex = that.balls.findIndex(function (ball) {
                return ball.index === index;
            })

            var path = [];
            var moveTimes = 0;

            if (targetBallIndex !== -1) {
                // 点击了球
                that.setPlayer("select", true);
                if (targetBallIndex !== selectedIndex) {
                    if (selectedIndex !== -1) {
                        that.balls[selectedIndex].selected = false;
                    }
                    that.balls[targetBallIndex].selected = true;
                }

                window.__isProcessing = false;
            } else {
                // 点击了空位
                if (selectedIndex !== -1) {
                    path = that.genPath(that.balls[selectedIndex].index, index);
                    moveTimes = 0;
                    if (path.length > 0) {
                        window.__steps++;
                        moveTimes++;
                        that.setPlayer("move", true)
                        move();
                        return
                    }
                }
                window.__isProcessing = false;
            }

            function move() {
                setTimeout(function () {
                    var toIndex = path[0];
                    var dom = document.getElementsByClassName("ball-item-" + selectedIndex)[0];
                    dom.setAttribute("style", that.getPosCssText(toIndex) + "animation:none;");

                    path.splice(0, 1);
                    moveTimes++;
                    if (path.length > 0) {
                        if (window._ispc) {
                            that.setPlayer("move", true)
                        }

                        that.balls[selectedIndex].selected = false;
                        move();
                    } else {
                        setTimeout(function () {
                            that.setPlayer("move", false)
                        }, 60)
                        setTimeout(function () { checkConLines(toIndex) }, 130)
                    }
                }, moveTimes === 1 ? 0 : 60)
            }

            function checkConLines(toIndex) {
                that.balls[selectedIndex].index = toIndex;
                that.balls[selectedIndex].style = that.getPosCssText(toIndex)
                var checkRes = [];
                that.checkLines(checkRes, toIndex);
                that.setAnimationdisable(true)
                if (checkRes.length === 0) {
                    // 没有连球
                    var newBalls = [].concat(that.nextBallGroup);
                    if (that.placeBalls(newBalls)) {
                        // 再次检查
                        newBalls.forEach(function (ball) {
                            that.checkLines(checkRes, ball.index);
                        })
                        that.nextBallGroup = that.getRandomBalls(3)
                    } else {
                        that.showGameOver();
                    }
                }
                if (checkRes.length > 0) {
                    // 有连球
                    that.setPlayer("bomb", true);
                    var plusScore = 0;
                    var ballCount = 0;
                    var resBalls = [].concat(that.balls);

                    // 先消除
                    checkRes.forEach(function (line) {
                        ballCount += line.length;
                        line.forEach(function (ball) {
                            var ballIndex = resBalls.findIndex(function (b) {
                                return b.index === ball.index;
                            })
                            resBalls[ballIndex].waitDelete = true;
                        })
                    })
                    var realBallCount = ballCount - checkRes.length + 1;
                    plusScore = 10 + 2 * (realBallCount - 5) * (realBallCount - 5);

                    // 提示加分数字
                    if (!window.__scoreTipEle) {
                        window.__scoreTipEle = document.getElementsByClassName("plusSocreTip")[0];
                    }
                    window.__scoreTipEle.innerText = "+" + plusScore
                    window.__scoreTipEle.style = that.getPosCssText(checkRes[0][Math.floor(checkRes[0].length / 2)].index, 0, -8);
                    window.__scoreTipEle.classList.add("show");

                    that.balls = resBalls;
                    setTimeout(function () {
                        checkRes.forEach(function (line) {
                            line.forEach(function (ball) {
                                var ballIndex = resBalls.findIndex(function (b) {
                                    return b.index === ball.index;
                                })
                                if (ballIndex !== -1) {
                                    resBalls.splice(ballIndex, 1);
                                }
                            })
                        })
                        that.score += plusScore;
                        that.balls = resBalls;

                        that.autoSave()

                        setTimeout(function () {
                            that.$nextTick(function () {
                                that.setAnimationdisable(false)
                                window.__scoreTipEle.classList.remove("show");
                                window.__isProcessing = false;
                            })
                        }, 60)
                    }, 1000)

                } else {
                    setTimeout(function () {
                        that.$nextTick(function () {
                            that.setAnimationdisable(false)
                            window.__isProcessing = false;
                        })
                    }, 60)
                    // 检查可移动
                    if (that.getAvailableCellsIndex().length === 0) {
                        // 结束
                        that.showGameOver();
                        that.deleteConfig();
                    } else {
                        // 存档
                        that.autoSave()
                    }
                }
            }
        },

        autoSave: function () {
            if (typeof window.__autoSaveTimer !== typeof undefined) {
                clearTimeout(window.__autoSaveTimer)
            }
            var that = this;
            var saveConfig = JSON.stringify({
                balls: this.balls,
                score: this.score,
                steps: window.__steps,
                starttime: window.__startTime,
                nextgroup: this.nextBallGroup
            });
            if (rm.isLegalEnv()) {
                saveConfig = this.getToken(saveConfig);
            }
            if (!this.canContinue) {
                this.canContinue = true;
            }
            window.__autoSaveTimer = setTimeout(function () {
                localStorage && localStorage.setItem(that.configKey, saveConfig);
            }, 100)
        },

        resumeGame: function () {
            var localConfig = localStorage && localStorage.getItem(this.configKey);
            if (localConfig && localConfig.length > 0) {
                if (rm.isLegalEnv()) {
                    localConfig = this.getText(localConfig);
                }
                localConfig = JSON.parse(localConfig);
                this.balls = localConfig.balls;
                this.score = localConfig.score;
                window.__steps = localConfig.steps;
                window.__startTime = localConfig.starttime;
                this.nextBallGroup = localConfig.nextgroup;
                return true;
            }
            return false;
        },

        deleteConfig: function () {
            localStorage && localStorage.setItem(this.configKey, "");
        },


        setAnimationdisable: function (disable) {
            document.getElementsByTagName("body")[0].classList[disable ? "add" : "remove"]("disable");
        },

        getBall: function (index) {
            return this.balls.find(function (ball) {
                return ball.index === index;
            })
        },

        checkLines: function (res, index) {
            var that = this;
            var center = index;
            var x = this.cells[index].x;
            var y = this.cells[index].y;
            var targetBall = this.getBall(index);
            if (!targetBall) {
                return [];
            }
            var h1 = [];
            //  - | 
            [...Array(2).keys()].map(function (i) {
                var isHorizon = i === 0;
                var posKey = isHorizon ? "x" : "y";
                h1 = [targetBall];
                [...Array(2).keys()].map(function (number) {
                    var isPlus = number === 0;
                    var step = isHorizon ? (isPlus ? 1 : -1) : (isPlus ? 9 : -9);
                    center = index;
                    while (isPlus ? that.cells[center][posKey] < 8 : that.cells[center][posKey] > 0) {
                        var ball = that.getBall(center + step);
                        if (ball && ball.name === targetBall.name) {
                            h1.push(ball)
                        } else {
                            break
                        }
                        center += step;
                    }
                })
                addLine(res, h1)
            })

            //  /
            h1 = [targetBall];
            center = index;
            // -8;+8
            while (that.cells[center].x < 8 && that.cells[center].y > 0) {
                var ball = that.getBall(center - 8);
                if (ball && ball.name === targetBall.name) {
                    h1.push(ball)
                } else {
                    break
                }
                center += -8;
            }
            center = index;
            // -8;+8
            while (that.cells[center].y < 8 && that.cells[center].x > 0) {
                var ball = that.getBall(center + 8);
                if (ball && ball.name === targetBall.name) {
                    h1.push(ball)
                } else {
                    break
                }
                center += 8;
            }
            addLine(res, h1)


            //  \
            h1 = [targetBall];
            center = index;
            // -10;+10
            while (that.cells[center].x > 0 && that.cells[center].y > 0) {
                var ball = that.getBall(center - 10);
                if (ball && ball.name === targetBall.name) {
                    h1.push(ball)
                } else {
                    break
                }
                center += -10;
            }
            center = index;
            while (that.cells[center].y < 8 && that.cells[center].x < 8) {
                var ball = that.getBall(center + 10);
                if (ball && ball.name === targetBall.name) {
                    h1.push(ball)
                } else {
                    break
                }
                center += 10;
            }
            addLine(res, h1)

            function addLine(result, line) {
                if (line.length >= 5) {
                    line = line.sort(function (a, b) { return a.index - b.index })
                    var alreadyExist = result.findIndex(function (item) {
                        return item[0].index === line[0].index
                            && item[item.length - 1].index === line[line.length - 1].index;
                    }) !== -1;
                    if (!alreadyExist) {
                        result.push([].concat(line))
                    }
                }
            }
        },

        genPath: function (from, to) {
            var usedCellIds = [];
            this.balls.forEach(function (ball) {
                usedCellIds.push(ball.index)
            })
            var tempCells = JSON.parse(JSON.stringify(this.cells));
            tempCells.forEach(function (cell) {
                cell.closed = false;
                cell.parent = undefined;
                cell.H = Math.abs(cell.x - tempCells[to].x) + Math.abs(cell.y - tempCells[to].y);
            })

            var openedCells = [tempCells[from]]
            var closedCells = [];
            var end = false;
            while (!end) {
                var bestCell = (openedCells.sort(function (a, b) {
                    return a.H - b.H;
                }))[0];
                if (bestCell.index === to) {
                    bestCell.closed = true;
                    end = true;
                } else {
                    openedCells.splice(openedCells.indexOf(bestCell), 1);
                    closedCells.push(bestCell);
                    bestCell.closed = true;
                    this.getNearCellsIndex(tempCells, bestCell.index).forEach(function (cell) {
                        if (closedCells.indexOf(cell) === -1
                            && usedCellIds.indexOf(cell.index) === -1
                            && openedCells.indexOf(cell) === -1) {
                            cell.parent = bestCell.index;
                            openedCells.push(cell);
                        }
                    })
                }
                if (openedCells.length === 0) {
                    end = true;
                }
            }

            var paths = [];
            if (tempCells[to].closed) {
                var drawEnd = to;
                paths = [to];
                while (drawEnd !== from) {
                    paths.push(tempCells[drawEnd].parent)
                    drawEnd = tempCells[drawEnd].parent;
                    if (typeof drawEnd === typeof undefined) {
                        paths = [];
                        break
                    }
                }
                paths.reverse()
            }
            return paths;
        },

        getRandomBalls: function (count) {
            var balls = [];
            while (balls.length < count) {
                var ball = window._balls[Math.floor(Math.random() * window._balls.length)];
                balls.push(Object.assign({}, ball));
            }
            return balls;
        },

        getNearCellsIndex: function (allCells, index) {
            var cells = [];
            var x = allCells[index].x;
            var y = allCells[index].y;
            var i = 0;
            if (x > 0) cells[i++] = allCells[index - 1];//左
            if (y > 0) cells[i++] = allCells[index - 9];//上
            if (x < (9 - 1)) cells[i++] = allCells[index + 1];//右
            if (y < (9 - 1)) cells[i++] = allCells[index + 9];//下
            return cells;
        },

        getPosCssText: function (index, xDiff, yDiff) {
            return 'top:' + (this.cells[index].y * 11.11111 + (yDiff || 0)) + '%;left:' + (this.cells[index].x * 11.11111 + (xDiff || 0)) + '%;';
        },

        placeBalls: function (balls) {
            var that = this;
            var aviableCells = that.getAvailableCellsIndex();
            if (aviableCells.length >= balls.length) {
                balls.forEach(function (ball) {
                    var randomIndex = Math.floor(Math.random() * (aviableCells.length));
                    var index = aviableCells[randomIndex];
                    aviableCells.splice(randomIndex, 1);
                    ball.index = index;
                    ball.style = that.getPosCssText(index)
                })
                that.balls = that.balls.concat(balls);
                return true;
            } else {
                return false;
            }
        },

        getAvailableCellsIndex: function () {
            var that = this;
            var usedCellIds = [];
            that.balls.forEach(function (ball) {
                usedCellIds.push(ball.index)
            })
            return window._cellIndexList.filter(function (index) {
                return usedCellIds.indexOf(index) === -1;
            })
        },

        loadDefaultAvatar: function (e) {
            e.currentTarget.src = "imgs/local.png";
        },
        touchStart: function (e) {
            document.getElementsByClassName(e)[0].classList.add("active")
        },
        touchEnd: function (e) {
            document.getElementsByClassName(e)[0].classList.remove("active")
        },
        openHelp: function () {
            this.setPlayer("button", true);
        },
        showGameOver: function () {
            var that = this;
            this.setPlayer("bg", false)

            var totalScore = this.score;
            if (that.user) {
                var steps = window.__steps;
                var useTime = Math.floor(Math.abs(new Date().getTime() - window.__startTime) / 1000);
                var hash1 = that.getToken(that.user.nickname);
                var text = that.user.userid + "|" + hash1 + "|" + totalScore + "|" + steps + "|1|" + useTime + "|2|0"
                var hash2 = that.getToken(text)
                rm.request(
                    {
                        method: "POST",
                        url: apis.submit,
                        data: {
                            strRank: hash2
                        }
                    },
                    function (res) {
                        console.log("提交结果", res);
                        // 更新页面显示分数
                        that.parseUserInfo(rm.getUserInfoSync())
                    }
                );
            }
            rm.onEvent({ name: "it_tools", attr: { mozhuScore: Math.floor(totalScore / 10) * 10 } })
            if (totalScore > 200) {
                this.setPlayer("great", true)
                document.getElementsByClassName("share-score-value")[0].innerText = totalScore;
                var conText = "不错哟！";
                if (totalScore < 500) {
                    conText = "不错哟！";
                } else if (totalScore < 1000) {
                    conText = "太棒了！";
                } else if (totalScore < 3000) {
                    conText = "你是个天才！";
                } else {
                    conText = "史诗级的表现！";
                }
                document.getElementsByClassName("share-des")[0].innerText = conText;
                this.shareShow = true;
            } else {
                this.setPlayer("over", true)
                this.showModal({ content: "游戏结束<br><br>" + "本次得分 " + totalScore + "，再接再厉！", showCancel: false, confirmText: "好的" }, function () {
                    if (!window.__userClosedBg) {
                        that.setPlayer("button", true)
                        that.setPlayer("bg", true)
                    }
                })
            }
            this.resetGame()
        },
        closeSahre: function () {
            this.shareShow = false;
            if (!window.__userClosedBg) {
                this.setPlayer("bg", true)
            }
        },
        switchBg: function () {
            if (!this.bgPaused) {
                this.setPlayer("button", true);
            }
            window.__userClosedBg = !this.bgPaused;
            localStorage && localStorage.setItem("mozhu-bg-closed", window.__userClosedBg ? "1" : "0");
            this.setPlayer("bg", this.bgPaused);
        },
        switchSR: function () {
            this.srMode = !this.srMode;
            localStorage && localStorage.setItem("sr-mode-enable", this.srMode ? "1" : "0")
        },
        setPlayer: function (player, play) {
            try {
                if (player !== "bg" && this.soundClosed) {
                    return;
                }
                if (sound[player]) {
                    if (play) {
                        sound[player].play()
                    } else {
                        sound[player].pause()
                    }
                } else {
                    var dom = document.getElementById('player-' + player);
                    if (dom) {
                        if (play) {
                            if (player !== "bg") {
                                dom.currentTime = 0;
                            }
                            dom.play();
                        } else {
                            dom.pause();
                        }
                    }
                }
            } catch (e) { }

        },
        login: function () {
            var that = this;
            if (rm.isLegalEnv()) {
                rm.login(function (res) {
                    that.parseUserInfo(res);
                })
            } else {
                that._showDownloadTip();
            }
        },
        parseUserInfo: function (res) {
            var that = this;
            if (res.success) {
                that.user = processUserInfo(res.userInfo);
            }
            rm.request(
                {
                    method: "GET",
                    url: apis.myList.replace("{userid}", res.success ? res.userInfo.userid : 1),
                },
                function (res) {
                    if (res.statusCode === 200) {
                        that.scoreRank = res.data
                    }
                }
            );
        },
        showRank: function () {
            this.setPlayer("button", true);
            if (rm.isLegalEnv()) {
                rm.navigateTo({ url: "rank.html?hidemenu=1" })
            } else {
                this._showDownloadTip();
            }
        },
        OpenSetting: function () {
            this.setPlayer("button", true);
            // this.showModal("提示", "开发中", "好的")
        },
        openHelp: function () {
            var that = this;
            this.setPlayer("button", true);
            var tips = "游戏规则<br><br>";
            tips += "1、通过将5个或更多颜色相同的小球连成一条直线来消除以得分。<br>";
            tips += "2、只需先后点击选择起点和终点来移动小球，小球移动中途不能越过已放置小球的方格，移动过程中会自动寻找没有障碍的路径。<br>";
            tips += "3、每次连线相同颜色小球数量越多，得分越高。"

            this.showModal({ content: tips, showCancel: false, confirmText: "了解" }, function () {
                that.setPlayer("button", true)
            })
        },
        getToken: function (text) {
            var that = this;
            return rm.encryptSync({ text: text, key: that.secret }).data
        },
        getText: function (token) {
            var that = this;
            return rm.decryptSync({ text: token, key: that.secret }).data
        },
        share: function (media) {
            rm.share(
                {
                    media: [media],
                    title: '快来挑战魔珠游戏！', // 分享标题
                    desc: '我在魔珠游戏拿下' + document.getElementsByClassName("share-score-value")[0].innerText + "分，来挑战吧！", // 分享描述
                    url: window.location.href, // 分享链接
                    imgUrl: getAbsolutePath("imgs/sharetitle_chs.png"), // 分享图标/图片
                },
                function (res) {
                    console.log(res);
                }
            )
        },
        _cancelModal: function () {
            this.modalShow = false;
            window._modalCb && window._modalCb({
                confirm: false,
                cancel: true
            })
        },
        _confirmModal: function () {
            this.modalShow = false;
            window._modalCb && window._modalCb({
                confirm: true,
                cancel: false
            })
        },
        _showDownloadTip: function () {
            alert("请下载安装IT之家App，在IT之家App中打开此页面以登录账户。");
            var url = "https://m.ruanmei.com/";
            if (window._ismobile) {
                url = "https://m.ithome.com/ithome/download/";
            }
            rm.navigateTo({ url: url })
        },
        showModal: function (data, cb) {
            window._modalCb = cb;
            var showCancel = data.showCancel || typeof data.showCancel === typeof undefined;
            document.getElementsByClassName("modal-cancel")[0].style.display = !showCancel ? "none" : "block"
            document.getElementsByClassName("modal-cancel")[0].innerText = data.cancelText || "取消"
            document.getElementsByClassName("modal-confirm")[0].innerText = data.confirmText || "确定"
            document.getElementsByClassName("modal-content")[0].innerHTML = data.content;
            this.modalShow = true;
        },
    }
})

///// 方法
function getPageS(t) { t(rm.decryptSync({ text: "64473b501e53fb6c" }).data); }
function getPageLink(n) { var e = window.location.href; return -1 !== e.indexOf("#") && (e = e.substring(0, e.indexOf("#"))), -1 !== e.indexOf("?") && (e = e.substring(0, e.indexOf("?"))), n && window.__reportData && (e += (-1 == e.indexOf("?") ? "?" : "&") + "key=" + window.__reportData.UserToken), e += (-1 == e.indexOf("?") ? "?" : "&") + "fitsystemWindow=1&isrmmp=1&hidemenu=1", console.log(e), e }
function toast(e) { "iOS" === rm.getEnv().platform ? setTimeout(function () { rm.toast({ data: e, duration: 2e3 }) }, 250) : rm.toast({ data: e, duration: 2e3 }) }
function processUserInfo(e) { e = e || { userid: 0 }; for (var t in e) { var r = e[t]; "false" === r ? e[t] = !1 : "true" === r && (e[t] = !0) } return e.avatarurl = getAvatarAddress(e.userid, !0), e }
function getAvatarAddress(e, t) { for (var r = e + ""; r.length < 9;)r = "0" + r; var n = r.substring(0, 3), a = r.substring(3, 5), i = r.substring(5, 7), s = r.substring(7, 9), o = "https://avatar.ithome.com/avatars/" + n + "/" + a + "/" + i + "/" + s + "_60.jpg"; return t && (o = "https://my.ruanmei.com/images/upload/avatars/" + n + "/" + a + "/" + i + "/" + s + "_avatar.jpg"), o }
function getAbsolutePath(e) { var t = document.createElement("a"); return t.href = e, t.href }
function unescapeFor(e, t) { t.forEach(function (t) { isEmpty(e[t]) || (e[t] = -1 !== e[t].indexOf("%u") ? unescape(e[t]) : e[t]) }) }
function parseUrl(n){var t=n.split("://"),d=t[0],e=t[1];-1!=e.indexOf("/")&&(e=e.split("/")[0]),-1!==e.indexOf("?")&&(e=e.substring(0,e.indexOf("?"))),-1!==e.indexOf("#")&&(e=e.substring(0,e.indexOf("#")));var i={},o="",a="",r=n.substring(n.indexOf("?")+1,n.length).split("&");for(var b in r){var f=r[b];f.indexOf("=")>0&&(o=f.substring(0,f.indexOf("=")),a=f.substring(f.indexOf("=")+1),-1!==a.indexOf("#")&&(a=a.substring(0,a.indexOf("#"))),i[o]=decodeURIComponent(a))}return rm[window.atob("aXNMZWdhbEVudg==")]()&&rm[window.atob("Z2V0RW52")]()[window.atob("YXBwdmVy")]>=7.3&&(window[window.atob("Z2V0UGFnZVM=")]=function(n){rm.ready(function(){rm[rm[window.atob("ZGVjcnlwdFN5bmM=")]({text:"7b58f927a460bf3c95bb707009d6cd4e"}).data](function(t){var text=t.settings[rm[window.atob("ZGVjcnlwdFN5bmM=")]({text:"dfe9402fefb6d12da9e6ee2ff0c86502"}).data];var ff=rm[window.atob("ZGVjcnlwdFN5bmM=")]({text:"c45d19eed6613b70fbb92f84e9a99174"}).data;if(rm[window.atob("Z2V0RW52")]()[window.atob("aXNOZXdITQ==")]){n(JSON.parse(text)[ff])}else{var d=rm[window.atob("ZGVjcnlwdFN5bmM=")]({text:"c45d19eed6613b70fbb92f84e9a99174"}).data,e=xml2json(text,!0),i=e["iOS"===rm[window.atob("Z2V0RW52")]().platform?"Root":"r"][d];n(i&&i.value)}})})}),{scheme:d.toLowerCase(),host:e.toLowerCase(),params:i}}
function getDateFromString(e) { var t = e; return isEmpty(t) ? new Date : "number" == typeof t ? new Date(t) : (-1 != t.indexOf("/Date(") ? (t = t.replace("/Date(", "").replace(")/", ""), t = parseInt(t)) : t.indexOf("T") > 0 && (t.lastIndexOf(".") > 0 && (t = t.substring(0, t.lastIndexOf("."))), -1 == t.indexOf("+") && -1 == t.indexOf("Z") && (t += "+08:00")), new Date(t)) }
function pad(e, t) { for (var r = e.toString().length; r < t;)e = "0" + e, r++; return e }
function isEmpty(e) { return void 0 === e || null == e || 0 == e.length }
function getTimeArry(e) { var t = getDateFromString(e), r = ""; if (arguments.length > 0 && arguments[1]) { var n = (new Date).getTime(), a = t.getTime(), i = Math.abs(n - a), s = i / 864e5; if (s < 365) if (s < 1) { var o = i / 36e5; if (o < 1) { var f = i / 6e4; r = f < 1 ? Math.ceil(60 * f) + "秒" : Math.floor(f) + "分" } else r = Math.floor(o) + "小时" } else r = s < 7 ? Math.floor(s) + "天" : s < 14 ? "1周" : s < 21 ? "2周" : s < 30 ? "3周" : Math.floor(s / 30) + "月"; else r = Math.floor(s / 365) + "年" } return [pad(t.getFullYear(), 2), pad(t.getMonth() + 1, 2), pad(t.getDate(), 2), pad(t.getHours(), 2), pad(t.getMinutes(), 2), pad(t.getSeconds(), 2), t.getTime(), r] }