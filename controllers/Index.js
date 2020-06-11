
const {site_config, recaptcha_config, ms_config} = require('../config');

function getIndex(req, res) {
    let html_subscriptions = '';
    for (let subscription of ms_config.subscriptions) {
        html_subscriptions += `<option value="${subscription.name}">${subscription.name}</option>`;
    }
    let html_domains = '';
    for (let domain of ms_config.domains) {
        html_domains += `<option value="${domain}">@ ${domain}</option>`;
    }
    
    const params = {
        notice: site_config.notice,
        line1: site_config.line1,
        line2: site_config.line2,
        subscriptions: html_subscriptions,
        domains: html_domains,
        code_store_link: site_config.code_store_link,
        recaptcha_sitekey: recaptcha_config.site_key
    };
    
    res.render('index', params);
}


module.exports = {
    getIndex
}
