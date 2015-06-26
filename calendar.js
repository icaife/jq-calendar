/**
 * @author Leon
 * @description 酒店日历控件V1.0
 * @date 2015年6月26日 
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
			"d": "日",
			"close": "关闭",
			"spec": "假日价格",
			"soldout": "售完",
			"week_prefix": "周",
			"checkout_tip": "最晚离店日期"
		},
		"tw": {
			"weeks": ["日", "一", "二", "三", "四", "五", "六"],
			"months": ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
			"today": "今天",
			"y": "年",
			"m": "月",
			"d": "日",
			"close": "關閉",
			"spec": "假日價格",
			"soldout": "售完",
			"week_prefix": "週",
			"checkout_tip": "最晚離店日期"
		},
		"en": {
			"weeks": ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
			"months": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
			"today": "Today",
			"y": "",
			"m": "",
			"d": "",
			"close": "Close",
			"spec": "Holiday date",
			"soldout": "Sold out date",
			"week_prefix": "",
			"checkout_tip": ""
		},
		"es": {
			"weeks": ["Dom", "Lu", "Ma", "Mx", "Ju", "Vi", "Sab"],
			"months": ["Enero", "Feb", "Marzo", "Abr", "Mayo", "Jun", "Jul", "Agosto", "Sept", "Oct", "Nov", "Dic"],
			"today": "hoy",
			"y": "",
			"m": "",
			"d": "",
			"close": "cerrar",
			"spec": "Alquiler fecha",
			"soldout": "Agotadas fecha",
			"week_prefix": "",
			"checkout_tip": ""
		}
	};

	var tffcal = {
		init: function(options) {
			var cfgs = {
				container: ".tff-cal", //日历容器
				prev: ".tff-prev", //上一月按钮
				next: ".tff-next", //下一月按钮
				lang: "cn", //语言
				showMonths: 2, //默认显示几个月
				focusDate: [new Date(2015, 5, 30)], //日历打开时 自动选择的日期，(月份为 当前月份，数组的第一个月份)  也可以传数组，focus多个时间 也可以传String,也可以传字面量{year : 2015,month : 6 ,day : 25} 数组也可以传哦,
				skipDate: new Date(2015, 5, 28), //哪些日期不能选
				onDayBuild: false, //每创建一天调用  day : 参数为当天，args : {focus : true|false,inRange : true|false,date : xxx}
				onBuildEnd: false, //创建完毕调用
				dayFormater: false, //日期格式化 每创建一天会调用，返回的参数为 day {focus : true|false,inRange : true|false,date : xxx} focus当前日期是否被自动选中，inRange 当前日期是否在minDate ~ maxDate之间
				dateFormat: "yyyy-mm-dd", //日期格式
				maxDate: new Date(2099, 11, 31), //最大可选日期
				minDate: new Date(), //最小可选日期
				selectOutOfRange: false, //不在minDate 和 maxDate 之间的日期是否可选择  true : 可选， false : 不可选
				changeOption: false, //改变参数的函数 传入参数  key  value
				cache: false //生成的月份内容 缓存开关  true : 开启  false : 关闭
			};
			var that = this;
			var params = $.extend({}, cfgs, options);
			this.config = params;

			that.bindEvents();
		},
		/**
		 * 绑定事件
		 */
		bindEvents: function() {
			var that = this;
			var params = this.config;
			var date = that.getDate($.isArray(params.focusDate) ? params.focusDate[0] : params.focusDate);
			var y = date.year;
			var m = date.month;
			var d = date.day;
			var dom = that.buildContent(y, m, d);
			$(".c-wraper").html(dom);

			//左右按钮事件
			$(params.next).on("click", function() {
				dom = that.buildContent(
					that.getNextMonth({
						year: y,
						month: m++
					})
				);
				$(".c-wraper").html(dom);
			});
			$(params.prev).on("click", function() {
				dom = that.buildContent(
					that.getPrevMonth({
						year: y,
						month: m--
					}, undefined, {
						__mode: -1
					})
				);
				// console.log(m);
				$(".c-wraper").html(dom);
			});
		},
		/**
		 * 从字符串中获取时间
		 * @param  {String|Date|Object} str       日期字符串 | 原生日期 | 字面量 {year : 2015,month : 6 , day : 25}
		 * @param  {String} filter                参数例子：'y+2', m+1',或'd+2' , 支持 'm+2,d+1'
		 * @param  {RegExp} reg                   获取正则
		 * @return {Object}                       {year : 2015,month : 6,day : 25,oriDate : Date}
		 */
		getDate: function(date, filter, reg) {
			var that = this;
			var y = 0;
			var m = 0;
			var d = 0;

			if (typeof date === "string") { //字符串日期
				reg = reg || /^(\d{4})\-(\d{1,2})\-(\d{1,2})$/;
				var tmp = date.match(reg);
				date = new Date(tmp[1], tmp[2], tmp[3]);
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
				}
			};
		},
		/**
		 * 格式化日期
		 * @param  {Date}     date    原生日期
		 * @param  {String}   fmt     日期格式  yyyy  年  m 月  d 日
		 * @return {String}           日期字符串
		 */
		format: function(date, fmt) {
			date = date instanceof Date ? date : new Date();
			fmt = fmt || "yyyy-mm-dd";
			var y = date.getFullYear(),
				m = date.getMonth(),
				d = date.getDate(),
				str = fmt.replace(/y+|m+|d+/g, function(tmp) {
					if (/y+/g.test(tmp)) {
						return y;
					}
					var f = /m+/g.test(tmp) ? m : /d+/g.test(tmp) ? d : 0;
					return tmp.length > 1 ? ("00".slice((f + "").length) + f) : f;
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
			return (new Date(y, m, d)).getDay();
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
			var that = this;
			var cfg = $.extend({}, that.config, args);
			var lang = cfg.lang;
			var weeks = tffCalLang[lang].weeks;
			var onDayBuild = (typeof cfg.onDayBuild === "function") ? cfg.onDayBuild : false;
			var focusDate = cfg.focusDate; //获得焦点的日期
			var skipDate = cfg.skipDate; //哪些日期不能选
			var dayFormater = cfg.dayFormater; //dat format
			var minDate = cfg.minDate; //最小可选日期
			var maxDate = cfg.maxDate; //最大可选日期
			var showMonths = cfg.showMonths || 1; //一次生成几个月
			var mode = cfg.__mode || 1; //大于0 为获取下一个月的，小于0 为 获取上一个月

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
						focus: that.dateEqual(tmp, focusDate),
						inRange: that.inRange(tmp, minDate, maxDate),
						skip: that.dateEqual(tmp, skipDate),
						date: that.getDate({
							year: y,
							month: m,
							day: i
						})
					};
					if (dayFormater) {
						str += (dayFormater && dayFormater(i, args));
					} else {
						str += "<li class=\"d-item" + (args.focus ? " d-hover" : "") + (args.inRange ? args.skip ? " d-dis" : "" : " d-dis") + "\">" + i + "</li>";
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
					var yStr = ("<div class=\"m-year\" data-year=\"{Y}\" data-month=\"{M}\"><b>{Y}" + tffCalLang[lang].y + "{M}" + tffCalLang[lang].m + "</b></div>").replace(/\{Y\}/g, y).replace(/\{M\}/g, m + 1); //年 + 月
					var wStr = "<ul class=\"m-week\"><li class=\"w-item w-wkend\">" + weeks[0] + "</li><li class=\"w-item\">" + weeks.slice(1, 6).join("</li><li class=\"w-item\">") + "</li><li class=\"w-item w-wkend\">" + weeks[6] + "</li></ul>"; //月
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

			return genMonth(showMonths);
		},
		/**
		 * 日期比较
		 * 
		 * @param  {Date|String|Object} date                          需要比较的日期 Date : 原生日期 String : 字符串日期  Object : 字面量日期 {year : 2015,month : 6 : day : 25}
		 * @param  {Date|String|Array[Date|String|Object]}   cpDate   对比日期
		 * @return {Boolean}                                          true : 相等 false : 不等
		 */
		dateEqual: function(date, cpDate) {
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
				return this.getDate(date).toString() === this.getDate(cpDate).toString();
			}
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
			minDate = minDate || this.config.minDate;
			maxDate = maxDate || this.config.maxDate;
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
				var d = +this.getDate(date).oriDate;
				var min = +this.getDate(minDate).oriDate;
				var max = +this.getDate(maxDate).oriDate;
				return d >= min && d <= max;
			}
		},
		// lang: tffCalLang[clientInfo.lang || "cn"],
		cache: {} //
	};

	window.tffcal = tffcal;
	tffcal.init();
});