/**
 * @author Leon
 * @description 酒店日历控件V1.0
 * @date 2015年6月26日 
 * @ps 全部月份统一成 0 开始，只有format函数 出来是真实的月份，即 月份从0开始
 * 全局只有一个calendar
 */

/*global $,console*/
"use strict";
$(function() {
	var tffCalLang = {
		"cn": {
			"weeks": ["日", "一", "二", "三", "四", "五", "六"],
			"months": ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
			"today": "今天",
			"y": "年",
			"m": "月",
			"d": "日"
		},
		"tw": {
			"weeks": ["日", "一", "二", "三", "四", "五", "六"],
			"months": ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
			"today": "今天",
			"y": "年",
			"m": "月",
			"d": "日"
		},
		"en": {
			"weeks": ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
			"months": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
			"today": "Today",
			"y": "",
			"m": "",
			"d": ""
		}
	};

	var tffcal = {
		init: function(options) {
			var that = this;
			var cfgs = that.defaults;
			var params = $.extend({}, cfgs, options);
			that.config = params;
			params.bindDom.data("tff_cal_index", this.elements.length); //给予下标
			var el = {
				el: params.bindDom,
				cfgs: params
			};
			that.elements.push(el); //将元素加到elements
			that.bindEvents(el); //绑定事件
			return true;
		},
		/**
		 * 绑定事件
		 */
		bindEvents: function(input) {
			var that = this;

			if (that.elements.length === 1) { //日历里面的事件只绑定一次
				//左右按钮事件
				var container = $(".tff-cal");
				container.on("click", ".tff-next", function() {
						var _el = that.elements[that.__curElementIndex];
						var _month = container.find(".m-year")
							.first();
						_el.cfgs.selectedDate.__year = _month.data("year"); //用于存储当前显示的月份，在左右切换月份的时候有用。
						_el.cfgs.selectedDate.__month = _month.data("month");
						_buildContent("next", _el.cfgs);
					})
					.on("click", ".tff-prev", function() {
						var _el = that.elements[that.__curElementIndex];
						var _month = container.find(".m-year")
							.last();
						_el.cfgs.selectedDate.__year = _month.data("year"); //用于存储当前显示的月份，在左右切换月份的时候有用。
						_el.cfgs.selectedDate.__month = _month.data("month");
						_buildContent("prev", _el.cfgs);
					})
					.on("click", ".d-item", function() { //日期选择事件
						var _this = $(this);
						if (_this.is(".d-dis") || _this.is(".d-none")) {
							return false;
						}
						var _el = that.elements[that.__curElementIndex];

						_el.dayDoms.filter(".d-selected")
							.not(_el.cfgs.__endTo ? ".d-end" : _el.cfgs.__startFrom ? ".d-start" : "")
							.removeClass("d-selected d-start d-end");
						_this.addClass("d-selected" + (_el.cfgs.__endTo ? " d-start" : _el.cfgs.__startFrom ? " d-end" : ""));

						var date = that.getDate({
							year: +_this.data("year"),
							month: +_this.data("month"),
							day: +_this.data("day")
						});

						date.week = +_this.data("week");

						var fmtDate = that.format(date);
						_el.cfgs.selectedDate = date;
						// console.log(date);
						_el.el[_el.el[0].tagName in {
							"INPUT": 1,
							"TEXTAREA": 1
						} ? "val" : "text"](fmtDate);

						void(_el.cfgs.onSelect && _el.cfgs.onSelect.call(_el.el, fmtDate, date));
						void(_el.cfgs.autoClose && that.hide());
					})
					.on("mouseenter", ".d-item", function() { //移动到天上
						if (/d\-(none)|(dis)/.test(this.className)) { //移到不可选的地方，恢复duration
							_resetDuration();
							return false;
						}
						var _this = $(this);
						var input = that.elements[that.__curElementIndex];
						var date = _this.data("date");
						if (input.cfgs.__endTo) { //开始
							_genDuration(date, input.cfgs.__endTo.cfgs.selectedDate, input.dayDoms);
						} else if (input.cfgs.__startFrom) { //结束
							_genDuration(input.cfgs.__startFrom.cfgs.selectedDate, date, input.dayDoms);
						}
					})
					.on("mouseleave", ".m-day", function() { //移到不可选的地方，恢复duration
						if (that.__visible) {
							_resetDuration();
						}
					});
			}

			//绑定了日历的元素触发日历显示
			input.el.on(input.cfgs.eventType, function() {
					var _index = $(this)
						.data("tff_cal_index");
					if (that.__curElementIndex === _index) {
						return false;
					}
					that.__curElementIndex = _index; //当前点击的控件下标

					_buildContent("cur", that.elements[_index].cfgs);

					that.show(); //显示日历
				})
				.on("blur", function() {
					// that.hide();
				});

			//创建日期期间
			function _genDuration(startDate, endDate, dayDoms) {
				dayDoms = dayDoms || that.elements[that.__curElementIndex].dayDoms;

				for (var i = 0, len = dayDoms.length; i < len; i++) {
					var _curDom = dayDoms.eq(i);
					var _curDate = _curDom.data("date");
					switch (that.dateCompare(_curDate, startDate) + that.dateCompare(endDate, _curDate)) {
						case 2:
							_curDom.addClass("d-during");
							break;
						default:
							_curDom.removeClass("d-during");
					}
				}
			}



			//创建内容
			function _buildContent(type, o) { //type: next 为下一个月  prev为上一个月   其余则为当月
				var params = o;
				// var date = that.getDate($.isArray(params.s) ? params.focusDate[0] : params.focusDate);
				var selectedDate = params.selectedDate;
				var date = that.getDate(selectedDate);
				// o.selectedDate = date;
				selectedDate.__year = selectedDate.__year || date.year;
				selectedDate.__month = selectedDate.__month === 0 ? 0 : (selectedDate.__month || date.month);
				var domStr = "";


				if (type === "next") { //下个月
					domStr = that.buildContent(that.getCurMonth({
						year: selectedDate.__year,
						month: ++selectedDate.__month
					}), undefined, params);
				} else if (type === "prev") { //上个月
					domStr = that.buildContent(that.getCurMonth({
						year: selectedDate.__year,
						month: --selectedDate.__month
					}), undefined, $.extend({}, params, {
						__mode: -1
					}));
				} else { //当前月份
					domStr = that.buildContent(date.year, date.month, params);
				}

				that.elements[that.__curElementIndex].dayDoms = $(o.container)
					.find(".c-wraper")
					.html(domStr)
					.find(".d-item")
					.not(".d-none")
					.not(".d-dis");
				_resetDuration();
				return domStr;
			}

			//重置duration
			function _resetDuration() {
				var input = that.elements[that.__curElementIndex];

				if (input.cfgs.__endTo || input.cfgs.__startFrom) {
					var cfgs = input.cfgs;
					if (cfgs.__endTo) {
						_genDuration(cfgs.selectedDate, cfgs[input.cfgs.__endTo ? "__endTo" : "__startFrom"].cfgs.selectedDate, input.dayDoms);
					} else {
						_genDuration(cfgs[input.cfgs.__endTo ? "__endTo" : "__startFrom"].cfgs.selectedDate, cfgs.selectedDate, input.dayDoms);
					}
				}
			}
		},
		/**
		 * 从字符串中获取时间
		 * @param  {String|Date|Object} str       日期字符串(真实日期 2015-6-30 就是真实的六月三十日，对应的字面量为{year : 2015,month : 5 , day : 30}) | 原生日期 | 字面量 {year : 2015,month : 6 , day : 25}
		 * @param  {String} filter                参数例子：'y+2', m+1',或'd+2' , 支持 'm+2,d+1'
		 * @param  {RegExp} reg                   获取正则
		 * @return {Object}                       {year : 2015,month : 6,day : 25,oriDate : Date}
		 */
		getDate: function(date, filter, reg) {
			if (!date) {
				return null;
			}
			var that = this;
			var y = 0;
			var m = 0;
			var d = 0;

			if (typeof date === "string") { //字符串日期
				reg = reg || /^(\d{4})\-(\d{1,2})\-(\d{1,2})$/;
				var tmp = date.match(reg);
				date = new Date(tmp[1], tmp[2] - 1, tmp[3]);
			} else if (typeof date === "object") { //字面量日期
				date = date instanceof Date ? date : new Date(date.year | 0, date.month | 0, date.day || 1);
			} else {
				date = new Date();
			}

			y = date.getFullYear();
			m = date.getMonth();
			d = date.getDate();

			if (typeof filter === "string") {
				var filterReg = /^(y|m|d)+((?:\+|\-)(?:\d+))$/;
				var result = filter.match(filterReg);
				if (!result && !result.length) {
					result = ["d+0", "d", "+0"];
				}
				var mode = result[1];
				var num = +result[2] || 0;
				switch (mode) {
					case "y":
						y += num;
						break;
					case "m":
						m += num;
						break;
					case "d":
						d += num;
						break;
					default:
						void(0);
				}
			}

			var tmpDate = new Date(y, m, d);

			return {
				year: tmpDate.getFullYear(),
				month: tmpDate.getMonth(),
				day: tmpDate.getDate(),
				week: tmpDate.getDay(),
				oriDate: tmpDate,
				toString: function() {
					return that.format(tmpDate);
				},
				value: +tmpDate
			};
		},
		/**
		 * 格式化日期
		 * @param  {Date|Object}     date    原生日期 或者字面量 也可以
		 * @param  {String}   fmt     日期格式  yyyy  年  m 月  d 日
		 * @return {String}           返回真实的时间字符串  从月份 1 开始
		 */
		format: function(date, fmt) {
			date = date instanceof Date ? date : new Date(date.year | 0, date.month | 0, date.day | 0);
			fmt = fmt || this.defaults.dateFormat || "yyyy-mm-dd";
			var y = date.getFullYear(),
				m = date.getMonth(),
				d = date.getDate(),
				str = fmt.replace(/y+|m+|d+/g, function(tmp) {
					if (/y+/g.test(tmp)) {
						return y;
					}
					var f = /m+/g.test(tmp) ? m + 1 : /d+/g.test(tmp) ? d : 0;
					return tmp.length > 1 ? ("00".slice((f + "")
						.length) + f) : f;
				});
			return str;
		},
		/**
		 * 获取星期几
		 * @param  {Number} y 年
		 * @param  {Number} m 月
		 * @param  {Number} d 日
		 * @return {Number}   星期几
		 */
		getWeekDay: function(y, m, d) {
			return (new Date(y, m, d))
				.getDay();
		},
		/**
		 * 获取当月最后一天
		 * @param  {Number} y 年
		 * @param  {Number} m 月
		 * @return {Number}   当月最后一天
		 */
		getDays: function(y, m) {
			y = y + ((m / 11) | 0);
			var isLeap = ((y % 4 === 0) && (y % 100 !== 0)) || (y % 400 === 0); //判断是否是闰年
			return [31, (isLeap ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m > 11 ? (m % 12) : m];
		},
		getNextDay: function(date) {
			return this.getDate(date, "d+1");
		},
		getPrevDay: function(date) {
			return this.getDate(date, "d-1");
		},
		getCurDay: function(date) {
			return this.getDate(date, "d+0");
		},
		getNextMonth: function(date) {
			return this.getDate(date, "m+1");
		},
		getPrevMonth: function(date) {
			return this.getDate(date, "m-1");
		},
		getCurMonth: function(date) {
			return this.getDate(date, "m+0");
		},
		/**
		 * 构建日历内容
		 * @param  {Number} y 年  | {Object} 传字面量也可以
		 * @param  {Number} m 月
		 * @param  {Object} args {} 自定义参数 maxDate minDate 等
		 * @return {String}   构建后的字符串
		 */
		buildContent: function(y, m, args) {
			var that = this,
				cfg = $.extend({}, that.defaults, args),
				lang = cfg.lang,
				weeks = tffCalLang[lang].weeks,
				onDayBuild = (typeof cfg.onDayBuild === "function") ?
				cfg.onDayBuild : false,
				onBuildEnd = (typeof cfg.onBuildEnd === "function") ? cfg.onBuildEnd : false,
				focusDate = cfg.focusDate //获得焦点的日期
				,
				skipDate = cfg.skipDate //哪些日期不能选
				,
				selectedDate = cfg.selectedDate //选中日期
				,
				relativeDate = ((cfg.__startFrom || cfg.__endTo || {})
					.cfgs || {})
				.selectedDate || false, //关联的日期，用于开始时间和结束时间

				dayFormater = cfg.dayFormater //dat format
				,
				minDate = cfg.minDate //最小可选日期
				,
				maxDate = cfg.maxDate //最大可选日期
				,
				showMonths = cfg.showMonths || 1 //一次生成几个月
				,
				mode = cfg.__mode || 1; //大于0 为获取下一个月的，小于0 为 获取上一个月

			// console.log(args);

			function genEmpty(n, t) {
				var str = "";
				if (n <= 0) {
					return str;
				}
				for (var i = 0; i < n; i++) {
					str += t || "<li class=\"d-item d-none\">&nbsp;</li>";
				}
				return str;
			}

			function genDay(n) {
				var str = "";
				for (var i = 1; i <= n; i++) {
					var tmp = {
						year: y,
						month: m,
						day: i
					};
					var args = { //回调函数的参数
						date: that.getDate(tmp)
					};

					args.inRange = that.inRange(tmp, minDate, maxDate);
					if (args.inRange) {
						args.focus = that.dateEqual(tmp, focusDate);
						args.skip = that.dateEqual(tmp, skipDate);
						args.selected = that.dateEqual(tmp, [selectedDate, relativeDate]); //选中状态
					}


					if (dayFormater) {
						str += (dayFormater && dayFormater(i, args)) || "";
					} else {
						var tmpClass = "";
						if (cfg.__startFrom) {
							tmpClass = that.dateEqual(tmp, relativeDate) ? " d-start" : " d-end";
						} else if (cfg.__endTo) {
							tmpClass = that.dateEqual(tmp, relativeDate) ? " d-end" : " d-start";
						}

						str += "<li data-date=\"" + that.format(args.date) + "\" data-day=\"" + i + "\" data-week=\"" + args.date.week + "\" data-month=\"" + args.date.month +
							"\" data-year=\"" + args.date.year + "\" class=\"d-item" + (args.focus ? " d-focus" : "") + (args.inRange ? (args.skip ? " d-dis" : (args.selected ?
								" d-selected" + tmpClass : "")) : " d-dis") + "\">" +
							"<span class=\"d-wraper\">" + i +
							"</span>" +
							"</li>";
					}

					void(onDayBuild && onDayBuild.call(that, i, args));
				}
				return str;
			}

			function genMonth(n) {
				var date = new Date();

				m = (typeof y === "object" && y.month !== 0) ? ((m | 0) || y.month || date.getMonth()) : m | 0; //获取月份
				y = ((y | 0) || y.year || date.getFullYear()); //获取年份

				var monthArr = [];
				var day = that.getDays(y, m); //获取当月最后一天
				var wkDay = that.getWeekDay(y, m, 1); //获取当天星期几
				for (var i = 0; i < n; i++) {
					var yStr = ("<div class=\"m-year\" data-year=\"{Y}\" data-month=\"" + m + "\"><b>{Y}" + tffCalLang[lang].y + "{M}" + tffCalLang[lang].m + "</b></div>")
						.replace(/\{Y\}/g, y)
						.replace(/\{M\}/g, m + 1); //年 + 月
					var wStr = "<ul class=\"m-week\"><li class=\"w-item w-wkend\">" + weeks[0] + "</li><li class=\"w-item\">" + weeks.slice(1, 6)
						.join("</li><li class=\"w-item\">") + "</li><li class=\"w-item w-wkend\">" + weeks[6] + "</li></ul>"; //月
					var dStr = "<ul class=\"m-day\">" + genEmpty(wkDay) + genDay(day) + genEmpty(42 - day - wkDay) + "</ul>"; //日 总共42格 没填满的用空白填
					monthArr[mode > 0 ? "push" : "unshift"]("<div class=\"c-month\">" + yStr + wStr + dStr + "</div>");
					var _d = that[mode > 0 ? "getNextMonth" : "getPrevMonth"]({ //获取下一个月
						year: y,
						month: m
					});
					y = _d.year;
					m = _d.month;
					day = that.getDays(y, m); //获取当月最后一天
					wkDay = that.getWeekDay(y, m, 1); //获取当天星期几          
				}
				return monthArr.join("");
			}
			var resultStr = genMonth(showMonths);

			void(onBuildEnd && onBuildEnd());
			return resultStr;
		},
		/**
		 * 日期比较是否相等
		 * 
		 * @param  {Date|String|Object} date                          需要比较的日期 Date : 原生日期 String : 字符串日期  Object : 字面量日期 {year : 2015,month : 6 : day : 25}
		 * @param  {Date|String|Array[Date|String|Object]}   cpDate   对比日期
		 * @return {Boolean}                                          true : 相等 false : 不等
		 */
		dateEqual: function(date, cpDate) {
			if (!date || !cpDate) {
				return false;
			}
			if (cpDate instanceof Array) {
				var flag = false;
				for (var i = 0; i < cpDate.length; i++) {
					flag = this.dateEqual(date, cpDate[i]);
					if (flag) {
						return flag;
					}
				}
				return flag;
			} else {
				// console.log(this.getDate(date).toString(), this.getDate(cpDate).toString());
				return this.getDate(date)
					.toString() === this.getDate(cpDate)
					.toString();
			}
		},
		/**
		 * 日期比较大小
		 * @param  {Date|Object} aDate 原生日期或者字面量  {year : 2015,month : 6 : day : 25}
		 * @param  {Date|Object} bDate 原生日期或者字面量  {year : 2015,month : 6 : day : 25}
		 * @return {Int}       1:aDate > bDate 0:aDate = bDate -1:aDate < bDate
		 */
		dateCompare: function(aDate, bDate) {
			if (!aDate) {
				return -1;
			}
			if (!bDate) {
				return 1;
			}
			var a = +this.getDate(aDate)
				.value;
			var b = +this.getDate(bDate)
				.value;
			return a === b ? 0 : (a > b ? 1 : -1);
		},
		/**
		 * 比较是否在minDate 和 maxDate 之间
		 * 
		 * @param  {Date|String|Object|Array[Date|String|Object]} date    需要比较的时间
		 * @param  {Date|String|Object}                           minDate 最小时间 
		 * @param  {Date|String|Object}                           maxDate 最大时间
		 * @return {Boolean}                                      true : 在时间段内，false : 不在时间段内
		 */
		inRange: function(date, minDate, maxDate) {
			minDate = minDate || this.defaults.minDate;
			maxDate = maxDate || this.defaults.maxDate;

			if (date instanceof Array) {
				var flag = true;
				for (var i = 0; i < date.length; i++) {
					flag = this.inRange(date[i], minDate, maxDate);
					if (!flag) {
						return flag;
					}
				}
				return flag;
			} else {
				var d = +this.getDate(date)
					.oriDate;
				var min = +this.getDate(minDate)
					.oriDate;
				var max = +this.getDate(maxDate)
					.oriDate;
				return d >= min && d <= max;
			}
		},
		//显示日历
		show: function() {
			this.__visible = true;
			$(this.defaults.container)
				.show();
		},
		//隐藏日历
		hide: function() {
			var that = this;
			that.__visible = false;
			that.__curElementIndex = -1;
			$(that.defaults.container)
				.hide();
		},
		cache: {},
		elements: [], //绑定的元素
		relateTo: function(startEl, endEl) { //关联到 结束的时间
			// console.log(arguments);
			var startIndex = startEl.data("tff_cal_index");
			var endIndex = endEl.data("tff_cal_index");
			var sel = this.elements[startIndex];
			var eel = this.elements[endIndex];
			sel.cfgs.__endTo = eel; //结束时间
			eel.cfgs.__startFrom = sel; //开始时间
		},
		isVisible: function() {
			return this.__visible;
		},
		defaults: {
			container: ".tff-cal", //日历容器
			prev: ".tff-prev", //上一月按钮
			next: ".tff-next", //下一月按钮
			lang: "cn", //语言
			showMonths: 2, //默认显示几个月
			focusDate: [new Date()], //日历打开时 focus的时间，类似“今天”，(月份为 当前月份，数组的第一个月份)  也可以传数组，focus多个时间 也可以传String,也可以传字面量{year : 2015,month : 6 ,day : 25} 数组也可以传。
			skipDate: [], //哪些日期不能选
			selectedDate: new Date(), //初始已选中的日期 ,也可以传字面量日期，原生日期，数组
			onDayBuild: false, //每创建一天调用  day : 参数为当天，args : {focus : true|false,inRange : true|false,date : xxx}
			onBuildEnd: false, //创建完毕调用
			onSelect: false,
			onShow: false,
			onClose: false,
			dayFormater: false, //日期格式化 每创建一天会调用，返回的参数为 day {focus : true|false,inRange : true|false,date : xxx} focus当前日期是否被自动选中，inRange 当前日期是否在minDate ~ maxDate之间
			dateFormat: "yyyy-mm-dd", //日期格式
			maxDate: new Date(2099, 11, 31), //最大可选日期
			minDate: new Date(), //最小可选日期
			selectOutOfRange: false, //不在minDate 和 maxDate 之间的日期是否可选择  true : 可选， false : 不可选
			changeOption: false, //改变参数的函数 传入参数  key  value
			cache: false, //生成的月份内容 缓存开关  true : 开启  false : 关闭
			bindDom: $(".tff-cal-input"), //绑定的元素
			eventType: "click", //触发的日历的事件类型
			langLab: tffCalLang, //语言包
			autoClose: false //选择后是否自动关闭
		}
	};

	$.fn.tffCal = function() {
		var args = arguments;
		return this.each(function() {
			if (typeof args[0] === "string") {
				var method = tffcal[args[0]];
				if ($.isFunction(method)) {
					var tmpArgs = [].slice.call(args, 1);
					method.apply(tffcal, args[0] === "relateTo" ? [$(this)].concat(tmpArgs) : tmpArgs);
				} else if (args[0] === "changeOption") {
					var _index = $(this)
						.data("tff_cal_index");
					var _el = tffcal.elements[_index];
					if ($.isPlainObject(args[1])) {
						_el.cfgs = $.extend({}, _el.cfgs, args[1]);
					}
				}
			} else {
				var options = args[0] || {};
				options.bindDom = $(this);
				tffcal.init(options);
			}
		});
	};

	$.fn.tffCal.tool = tffcal;

	var start = $(".cal-start")
		.tffCal({
			onSelect: function(dateStr, date) {
				// console.log(arguments);
				end.tffCal("changeOption", {
					minDate: date
				});
				console.log("start date selected!");
			},
			minDate: new Date(2015, 5, 1)
				// selectedDate: new Date(2015, 5, 10)
		});

	var end = $(".cal-end")
		.tffCal({
			onBuildEnd: function() {
				console.log("on build end!");
			},
			onDayBuild: function() {
				console.log("on day build!");
			},
			onSelect: function(data) {
				// end.tffCal("changeOption", {
				// 	minDate: data
				// });
				console.log("start date selected!");
			},
			minDate: new Date(2015, 5, 1),
			selectedDate: new Date(2015, 5, 1)
		});

	start.tffCal("relateTo", end); //start 和 end 关联起来
	// console.log(x);
	// $(".tff-cal-input").eq(1).tffCal("changeOption", {
	// 	minDate: new Date(2015, 8, 9)
	// });

});