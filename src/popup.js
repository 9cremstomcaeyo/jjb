import * as _ from "lodash"
$ = window.$ = window.jQuery = require('jquery')

import {DateTime} from 'luxon'
import tippy from 'tippy.js'
import 'weui';
import weui from 'weui.js'
import Vue from 'vue'

import { getSetting } from './utils'
import { getLoginState } from './account'

import App from './components/App.vue';
import VueLazyload from 'vue-lazyload'

Vue.use(VueLazyload, {
  preLoad: 1.3,
  error: 'https://jjbcdn.zaoshu.so/web/img_error.png',
  attempt: 1
})
new Vue({
  el: '#app',
  render: h => h(App)
})

function showJEvent(rateLimit) {
  if (rateLimit) {
    let today = DateTime.local().toFormat("o")
    let showRecommendState = getSetting('showRecommendState', {
      date: today,
      times: 0
    })
    if (showRecommendState.date == today) {
      if (showRecommendState.times > rateLimit.limit) {
        return console.log('展示次数超限')
      } else {
        showRecommendState.times = showRecommendState.times + 1
      }
    } else {
      showRecommendState.date = today
      showRecommendState.times = 1
    }
    localStorage.setItem('showRecommendState', JSON.stringify(showRecommendState))
  }
  // 加载反馈
  if (!$("#jEventIframe").attr('src') || $("#jEventIframe").attr('src') == '') {
    $("#jEventIframe").attr('src', "https://jjb.zaoshu.so/recommend")
    setTimeout(function () {
      $('.iframe-loading').hide()
    }, 800)
  }
  $("#jEventDialags").show()
}


$( document ).ready(function() {
  const paid = localStorage.getItem('jjb_paid');
  const account = localStorage.getItem('jjb_account');
  let loginState = getLoginState()

  // tippy
  tippy('.tippy')

  // 查询最新版本
  $.getJSON(`https://jjb.zaoshu.so/updates?buildid=${process.env.BUILDID}&browser=${process.env.BROWSER}`, function (lastVersion) {
    if (!lastVersion) return localStorage.removeItem('newVersion')
    let skipBuildId = localStorage.getItem('skipBuildId')
    let localBuildId = skipBuildId || process.env.BUILDID
    // 如果有新版
    if (localBuildId < lastVersion.buildId && lastVersion.notice) {
      localStorage.setItem('newVersion', lastVersion.versionCode)
      // 如果新版是主要版本，而且当前版本需要被提示
      if (lastVersion.major && localBuildId < lastVersion.noticeBuildId) {
        let noticeDialog = weui.dialog({
          title: `${lastVersion.title} <span class="dismiss">&times;</span>` || '京价保有版本更新',
          content: `${lastVersion.changelog}
            <div class="changelog">
              <span class="time">${lastVersion.time}</span>` +
             (lastVersion.blogUrl ? `<a class="blog" href="${lastVersion.blogUrl}" target="_blank">了解更多</a>` : '') +
            `</div>`,
          className: 'update',
          buttons: [{
            label: '不再提醒',
            type: 'default',
            onClick: function () {
              localStorage.setItem('skipBuildId', lastVersion.buildId)
            }
          }, {
            label: '下载更新',
            type: 'primary',
            onClick: function () {
              chrome.tabs.create({
                url: lastVersion.downloadUrl || `https://jjb.zaoshu.so/updates/latest?browser=${process.env.BROWSER}`
              })
            }
          }]
        });
        $(".update .dismiss").on("click", function () {
          noticeDialog.hide()
        })
      }
    } else {
      localStorage.removeItem('newVersion')
    }
  });

  // 是否已存在弹窗
  function isNoDialog(){
    return ($(".js_dialog:visible").length < 1) && ($(".weui-dialog:visible").length < 1)
  }

  // 常规弹窗延迟200ms
  setTimeout(() => {
    if (paid) {
      $("#dialogs").hide()
    }

    // 没有弹框 且 未登录账号
    if (isNoDialog() && (!account && loginState.class == "failed") || loginState.class == "unknown") {
      $("#loginNotice").show();
    }

    if (!account) {
      $("#clearAccount").addClass('weui-btn_disabled')
    }
  }, 200);


  $(".weui-dialog__ft a").on("click", function () {
    $("#dialogs").hide()
    $("#listenAudio").hide()
    $("#loginNotice").hide()
    $("#changeLogs").hide()
    if ($(this).data('action') == 'paid') {
      chrome.runtime.sendMessage({
        text: "paid"
      }, function(response) {
        console.log("Response: ", response);
      });
    } else {
      if ($(this).data('action') == 'pay') {
        showReward()
      }
    }
  })

  $("#listen").on("click", function () {
    $("#listenAudio").show()
  })

  $("#openWechatCard").on("click", function () {
    $("img.jjb-official").attr('src', "http://jjbcdn.zaoshu.so/wechat/qrcode_for_gh_21550d50400c_430.jpg")
    $("#wechatDialags").show()
  })

  $("#openjEventCard").on("click", function () {
    showJEvent()
  })

  $(".showLoginState").on("click", function () {
    $("#loginNotice").show()
  })

  $("#openFeedback").on("click", function () {
    // 加载反馈
    if ($("#feedbackIframe").attr('src') == '') {
      $("#feedbackIframe").attr('src', `https://i.duotai.net/forms/yovwz?version=${process.env.VERSION}`)
      setTimeout(function () {
        $('.iframe-loading').hide()
      }, 800)
    }
    $("#feedbackDialags").show()
  })

  $("#openFaq").on("click", function () {
    // 加载反馈
    if ($("#faqIframe").attr('src') == '') {
      $("#faqIframe").attr('src', "https://i.duotai.net/forms/oqyvk/1lpb11l2")
      setTimeout(function () {
        $('.iframe-loading').hide()
      }, 800)
    }
    $("#faqDialags").show()
  })

  $("#feedbackDialags .js-close").on("click", function () {
    $("#feedbackDialags").hide()
  })

  $("#faqDialags .js-close").on("click", function () {
    $("#faqDialags").hide()
  })

  $("#jEventDialags .js-close").on("click", function () {
    $("#jEventDialags").hide()
  })

  $("#dialogs .js-close").on("click", function () {
    $("#dialogs").hide()
  })

  $("#wechatDialags .js-close").on("click", function () {
    $("#wechatDialags").hide()
  })

  $("#clearAccount").on("click", function () {
    weui.confirm('清除密码将移除本地存储的账号密码；清除后若需继续使用请重新登录并选择让京价保记住密码', function () {
      localStorage.removeItem('jjb_account')
      chrome.tabs.create({
        url: "https://passport.jd.com/uc/login"
      })
    }, function () {
      console.log('取消清除')
    }, {
      title: '清除密码确认'
    });
  })


  $(".openLogin").on("click", function () {
    chrome.runtime.sendMessage({
      text: "openLogin",
    }, function(response) {
      console.log("Response: ", response);
    });
  })

  $("#pricePro").on("click", function () {
    chrome.runtime.sendMessage({
      text: "openPricePro"
    }, function (response) {
      console.log("Response: ", response);
    })
  })

})

// 防止缩放
chrome.tabs.getZoomSettings(function (zoomSettings) {
  if (zoomSettings.defaultZoomFactor > 1 && zoomSettings.scope == 'per-origin' && zoomSettings.mode == 'automatic') {
    let zoomPercent = (100 / (zoomSettings.defaultZoomFactor * 100)) * 100;
    document.body.style.zoom = zoomPercent + '%'
  }
})