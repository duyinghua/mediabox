$.fn.mediaBox = function (option) {
    var defOpt = {
        media: null,
        onStalled: null,
        onError: null,
        onPlay: null,
        onPause: null,
        onTimeupdate: null,
        onBtnEvent: null
    };
    option = $.extend(defOpt, option);
    var sec2time = function (time, format) {
        format = format || 'hh:mm:ss';
        var o;
        if (/(h+)/.test(format)) {
            var ht = Math.floor(time % 3600);
            o = {
                "h+": Math.floor(time / 3600), //hour
                "m+": Math.floor(ht / 60), //minute
                "s+": Math.floor(ht % 60) //second
            };
        } else {
            o = {
                "m+": Math.floor(time / 60), //minute
                "s+": Math.floor(time % 60) //second
            };
        }
        for (var k in o) {
            if (new RegExp("(" + k + ")").test(format)) {
                format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
            }
        }
        return format;
    };
    //进度条拖拽控制
    var sliderBarCtrl = function (media, $progressBar, $slider, $progressVal, $curTime) {
        var lastX, draging, progressWidth = $progressBar.width();
        $slider.on('touchstart', function (e) {
            e.preventDefault();
            e.stopPropagation();
            var et = e.changedTouches[0];
            draging = true;
            lastX = et.clientX;
        });
        $(document).on('touchmove', function (e) {
            var et = e.changedTouches[0];
            if (draging) {
                e.preventDefault();
                e.stopPropagation();
                media.pause();//拖拽时暂停视频播放，否则滑块继续走动会阻碍拖拽事件
                var diffX = et.clientX - lastX;
                var width = parseFloat($progressVal.width());//已播放进度条宽度px值
                width += diffX;
                width = width / progressWidth * 100;//已播放进度条宽度转为百分比宽度
                if (width <= 0) {
                    width = 0
                } else if (width >= 100) {
                    width = 100
                }
                $progressVal.width(width + '%');
                var curTime = $curTime.html();
                curTime = curTime.replace(/[\d-]/g, '-');
                var i = curTime.match(/(--)/g).length;
                var format = curTime.replace(/[\d-]{2}/g, function () {
                    switch (i--) {
                        case 3:
                            return 'hh';
                        case 2:
                            return 'mm';
                        case 1:
                            return 'ss';

                    }
                });
                $curTime.html(sec2time(media.duration * width / 100, format));
                lastX = et.clientX;
            }
        });
        $(document).on('touchend', function (e) {
            if (draging) {
                draging = false;
                var progressVal = parseFloat($progressVal.css('width'));
                var currentTime = parseInt(progressVal / 100 * media.duration);
                var bufferedTime = media.buffered.end(0);
                if (bufferedTime > currentTime) {//如果缓冲最大时间超过预设时间
                    media.currentTime = currentTime;
                } else {//如果预设时间超过缓冲最大时间，即还未缓冲加载到指定时间，就将指定时间改回缓冲最大时间，否则画面会静止不动直到缓冲时间走到指定时间
                    $progressVal.width(bufferedTime / media.duration * 100 + '%');
                    media.currentTime = bufferedTime - 5;
                }
                media.play();
            }
        });
    };
    if (option.media == 'video') {//视频
        this.each(function () {
            var $this = $(this);
            var videoUrl = '', posterUrl = '';
            if ($this.is('video')) {
                videoUrl = $this.attr('src');
                posterUrl = $this.attr('poster');
                posterUrl = posterUrl ? 'url(' + posterUrl + ')' : $this.css('backgroundImage');
            } else {
                var _video = $this.find('video');
                posterUrl = _video.attr('poster');
                if ($this.css('backgroundImage')) {
                    posterUrl = $this.css('backgroundImage');
                } else if (_video.css('backgroundImage')) {
                    posterUrl = _video.css('backgroundImage');
                } else {
                    posterUrl = 'url(' + posterUrl + ')';
                }
                videoUrl = _video.attr('src');
            }
            var $video = $('<video src="' + videoUrl + '" webkit-playsinline="true" preload="metadata"></video>');
            var video = $video[0];
            var $videoBox = $('<div class="jmb-video"></div>');
            var $loading = $('<div class="jmb-loading" style="display: none;"><div class="jmb-loader"></div></div>');
            var $toast = $('<div class="jmb-toast" style="display: none;" ></div>');
            var $toastTxt = $('<span class="jmb-toast-text"></span>');
            var $poster = $('<div class="jmb-poster"></div>');
            var $ctrl = $('<div class="jmb-ctrl-bar"></div>');
            var $play = $('<div class="jmb-play"></div>');
            var $btn = $('<div class="jmb-btn"></div>');
            var $progress = $('<div class="jmb-progress"></div>');
            var $curTime = $('<div class="jmb-cur-time">--:--:--</div>');
            var $totalTime = $('<div class="jmb-total-time">--:--:--</div>');
            var $progressBar = $('<div class="jmb-progress-bar"></div>');
            var $progressVal = $('<div class="jmb-progress-val"></div>');
            var $progressBuffer = $('<div class="jmb-progress-buffer"></div>');
            var $slider = $('<i class="jmb-progress-slider"></i>');
            $progressVal.append($slider);
            $progressBar.append($progressBuffer).append($progressVal);
            $progress.append($curTime).append($progressBar).append($totalTime);
            $toast.append($toastTxt);
            $ctrl.append($play).append($progress);
            $videoBox.append($video);
            $video.after($toast).after($poster).after($ctrl).after($loading);
            $this.replaceWith($videoBox);

            var playImage = 'data:img/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFoAAABaCAYAAAA4qEECAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJ bWFnZVJlYWR5ccllPAAAAyFpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdp bj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6 eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDE0IDc5LjE1 MTQ4MSwgMjAxMy8wMy8xMy0xMjowOToxNSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJo dHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlw dGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAv IiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RS ZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpD cmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChXaW5kb3dzKSIgeG1wTU06SW5zdGFuY2VJ RD0ieG1wLmlpZDpFRUNEMTQwRTcyRkExMUU1QUMyREY1REQxMUU2MzgwNSIgeG1wTU06RG9jdW1l bnRJRD0ieG1wLmRpZDpFRUNEMTQwRjcyRkExMUU1QUMyREY1REQxMUU2MzgwNSI+IDx4bXBNTTpE ZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkVFQ0QxNDBDNzJGQTExRTVBQzJE RjVERDExRTYzODA1IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkVFQ0QxNDBENzJGQTExRTVB QzJERjVERDExRTYzODA1Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBt ZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+hdxggwAACfJJREFUeNrsXXlM1Fcef1xSQFdKIRVkC4py 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';
            $poster.css({
                'background-image': 'url("' + playImage + '"),' + posterUrl,
                'background-repeat': 'no-repeat,no-repeat',
                'background-position': 'center center,center center',
                'background-size': '45px,cover'
            });
            var toastCloseTimer;
            var toast = function (text) {
                var methods = {
                    open: function () {
                        $toast.show();
                        $toastTxt.html(text);
                        clearTimeout(toastCloseTimer);
                        toastCloseTimer = setTimeout(function () {
                            methods.close();
                        }, 1888);
                    },
                    close: function () {
                        $toast.hide();
                        $toastTxt.text('');
                    }
                };
                if (text) {
                    methods.open();
                } else {
                    methods.close();
                }
            };
            $poster.on('click', function () {
                $poster.hide();
                video.play();
                $play.on('click', function (e) {
                    if (video.paused) {
                        video.play();
                    } else {
                        video.pause();
                    }
                });
            });
            $videoBox.on('click', function () {
                if ($ctrl.is(':visible')) {
                    $ctrl.fadeOut();
                } else {
                    $ctrl.fadeIn();
                }
            });
            $ctrl.on('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
            });
            $video.on('loadedmetadata', function () {
                $curTime.html(sec2time(video.currentTime));
                $totalTime.html(sec2time(video.duration));
                $video.addClass('played');
                sliderBarCtrl(video, $progressBar, $slider, $progressVal, $curTime);
            });
            $video.on('error', function (e) {//视频加载失败
                if (typeof option.onError == 'function') {
                    option.onError();
                } else {
                    toast('视频加载失败');
                }
                $loading.hide();
            });
            $video.on('stalled', function (e) {//网络状况不佳
                if (typeof option.onStalled == 'function') {
                    option.onStalled();
                } else {
                    toast('网络状况不佳');
                }
            });
            $video.on('waiting', function () {
                $loading.show();
            });
            $video.on('playing', function () {
                $loading.hide();
            });
            var progressTimer = setInterval(function () {//缓冲进度条监听事件，progress不靠谱
                if (video.buffered.length) {
                    if (video.currentTime + 1 >= video.buffered.end(0)) {//播放进度濒临缓冲进度
                        $loading.show();
                    } else {
                        $loading.hide();
                    }
                    $progressBuffer.width((video.buffered.end(0) / video.duration * 100) + '%');
                    if (video.buffered.end(0) == video.duration) {
                        clearInterval(progressTimer);
                    }
                }
            }, 1000);
            $video.on('timeupdate', function (e) {//播放进度条监听事件
                $curTime.html(sec2time(video.currentTime));
                $progressVal.width((video.currentTime / video.duration * 100) + '%');
                typeof option.onTimeupdate == 'function' && option.onTimeupdate();

            });
            $video.on('play', function () {
                $videoBox.addClass('playing');
                typeof option.onPlay == 'function' && option.onPlay();
            });
            $video.on('pause', function () {
                $videoBox.removeClass('playing');
                typeof option.onPause == 'function' && option.onPause();
            });
            if (option.onBtnEvent) {
                $ctrl.append($btn);
                $btn.on('click', function (e) {
                    typeof option.onBtnEvent == 'function' && option.onBtnEvent();
                });
            }
        });
    } else if (option.media == 'audio') {//音频
        this.each(function () {
            var $this = $(this);
            var audioUrl = '';
            if ($this.is('audio')) {
                audioUrl = $this.attr('src');
            } else {
                var _video = $this.find('audio');
                audioUrl = _video.attr('src');
            }
            var $audio = $('<audio src="' + audioUrl + '" preload="metadata"></audio>');
            var audio = $audio[0];
            var $audioBox = $('<div class="jmb-audio"></div>');
            var $ctrl = $('<div class="jmb-ctrl-bar"></div>');
            var $play = $('<div class="jmb-play"></div>');
            var $btn = $('<div class="jmb-btn"></div>');
            var $progress = $('<div class="jmb-progress"></div>');
            var $curTime = $('<div class="jmb-cur-time">--:--</div>');
            var $totalTime = $('<div class="jmb-total-time">--:--</div>');
            var $progressBar = $('<div class="jmb-progress-bar"></div>');
            var $progressVal = $('<div class="jmb-progress-val"></div>');
            var $progressBuffer = $('<div class="jmb-progress-buffer"></div>');
            var $slider = $('<i class="jmb-progress-slider"></i>');
            $progressVal.append($slider);
            $progressBar.append($progressBuffer).append($progressVal);
            $progress.append($progressBar).append($curTime).append('<span class="jmb-separator">/</span>').append($totalTime);
            $ctrl.append($play).append($progress);
            $audioBox.append($audio).append($ctrl);
            $this.replaceWith($audioBox);

            $play.on('click', function (e) {
                if (audio.paused) {
                    audio.play();
                } else {
                    audio.pause();
                }
            });
            $audio.on('loadedmetadata', function () {
                $curTime.html(sec2time(audio.currentTime, 'mm:ss'));
                $totalTime.html(sec2time(audio.duration, 'mm:ss'));
                $audio.addClass('played');
                sliderBarCtrl(audio, $progressBar, $slider, $progressVal, $curTime);
            });
            $audio.on('error', function (e) {//视频加载失败
                if (typeof option.onError == 'function') {
                    option.onError();
                } else {
                    alert('视频加载失败');
                }
            });
            $audio.on('stalled', function (e) {//网络状况不佳
                if (typeof option.onStalled == 'function') {
                    option.onStalled();
                } else {
                    alert('网络状况不佳');
                }
            });
            $audio.on('waiting', function () {
//                    console.log('waiting');
//                    $loading.show();
            });
            $audio.on('playing', function () {
//                    console.log('playing');
//                    $loading.hide();
            });
            var progressTimer = setInterval(function () {//缓冲进度条监听事件，progress不靠谱
                if (audio.buffered.length) {
//                        if (audio.currentTime + 1 >= audio.buffered.end(0)) {//播放进度濒临缓冲进度
//                            $loading.show();
//                        } else {
//                            $loading.hide();
//                        }
                    $progressBuffer.width((audio.buffered.end(0) / audio.duration * 100) + '%');
                    if (audio.buffered.end(0) == audio.duration) {
                        clearInterval(progressTimer);
                    }
                }
            }, 1000);
            $audio.on('timeupdate', function (e) {//播放进度条监听事件
                $curTime.html(sec2time(audio.currentTime, 'mm:ss'));
                $progressVal.width((audio.currentTime / audio.duration * 100) + '%');
                typeof option.onTimeupdate == 'function' && option.onTimeupdate();

            });
            $audio.on('play', function () {
                $audioBox.addClass('playing');
                typeof option.onPlay == 'function' && option.onPlay();
            });
            $audio.on('pause', function () {
                $audioBox.removeClass('playing');
                typeof option.onPause == 'function' && option.onPause();
            });
            if (option.onBtnEvent) {
                $ctrl.append($btn);
                $btn.on('click', function (e) {
                    typeof option.onBtnEvent == 'function' && option.onBtnEvent();
                });
            }
        });
    }
};