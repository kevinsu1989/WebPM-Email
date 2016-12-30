"use strict";
const _request = require("request");
const _child = require('child_process');
const _moment = require('moment');
const _config = require('../config');
const _schedule = require('node-schedule');

let sendMail = function(title, text, address) {
    console.log(`给${address}发送邮件：${title}`);
    _request.post({
        url: "http://10.1.172.58:8889/api/message/email",
        headers: {
            private_token: '9cb312d0-14d1-11e5-b79b-bfa179cfc352'
        },
        formData: {
            to: address,
            subject: title,
            text: text
        }
    })
}


let getPDF = function(page) {
    let name = page;
    let time = _moment().subtract(1, 'day');
    let timePath = `${time.year()}/${time.dayOfYear()}`;
    let pdfPath = `${_config.basePath}${_config.pdfPath}/${timePath}/${name}.pdf`;
    let imgPath = `${_config.basePath}${_config.imgPath}/${timePath}/${name}.png`;
    let htmlPath = `${_config.htmlPath}/${timePath}/${name}`;
    let commandPdf = `bin/phantomjs lib/pdf.js ${_config.server}${htmlPath} ${pdfPath}`;
    let commandImg = `bin/phantomjs lib/pdf.js ${_config.server}${htmlPath} ${imgPath}`;
    // console.log(commandPdf);
    // console.log(commandImg);
    _child.exec(commandPdf);
    _child.exec(commandImg);
    return {
        name: name,
        pdf: `${_config.server}${_config.pdfPath}/${timePath}/${name}.pdf`,
        img: `${_config.server}${_config.imgPath}/${timePath}/${name}.png`
    }
}

let getMailBody = function(pages) {
    let body = `<p>${getMailTitle()}</p>`,
        img = "",
        pdf = "<p>右键点击以下链接可下载pdf格式报告：</p>";
    pages.forEach(function(page) {
        img += `<img src="${page.img}" title="${page.name}"/><p/>`;
        pdf += `<a href="${page.pdf}">${page.name}</a><p/>`;
    });
    // console.log(body);
    body = body + img + pdf;
    return body
}

let getMailTitle = function() {
    let time = _moment().subtract(1, 'week');
    let title = `WebPM-${time.year()}年第${time.week()}周-周报`;
    // console.log(title);
    return title;
}

let doWork = function() {
        let pages = _config.pages;
        let mails = _config.mails;
        let pdfs = [];
        pages.forEach(function(page) {
            pdfs.push(getPDF(page));
        });
        // console.log(JSON.stringify(pdfs));

        let mailBody = getMailBody(pdfs);

        let mailTitle = getMailTitle();

        setTimeout(function() {
            mails.forEach(function(mail) {
                sendMail(mailTitle, mailBody, mail);
            });
        }, 1000 * 1);
    }
    // doWork();
exports.init = function() {

    let rule = new _schedule.RecurrenceRule()

    rule.dayOfWeek = 1;

    rule.hour = 8;

    let work = _schedule.scheduleJob(rule, doWork);

    console.log(`WebPM邮件服务已启动。`);
}