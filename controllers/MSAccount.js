const fetch = require('node-fetch');
const {site_config, recaptcha_config, ms_config} = require('../config');

function enQuery(data) {
    const ret = [];
    for (let d in data) {
        ret.push(encodeURIComponent(d) + "=" + encodeURIComponent(data[d]));
    }
    return ret.join("&");
}

function password_gen() {
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
    var string_length = 8;
    var randomstring = '';
    var charCount = 0;
    var numCount = 0;
    
    for (var i = 0; i < string_length; i++) {
        // If random bit is 0, there are less than 3 digits already saved, and there are not already 5 characters saved, generate a numeric value.
        if ((Math.floor(Math.random() * 2) == 0) && numCount < 3 || charCount >= 5) {
            var rnum = Math.floor(Math.random() * 10);
            randomstring += rnum;
            numCount += 1;
        } else {
            // If any of the above criteria fail, go ahead and generate an alpha character from the chars string
            var rnum = Math.floor(Math.random() * chars.length);
            randomstring += chars.substring(rnum, rnum + 1);
            charCount += 1;
        }
    }
    return randomstring;
}

async function validateRecaptcha(token) {
    console.log('env:', process.env.ENV);
    if (process.env.ENV === 'dev') return true;

    try {
        const url = 'https://www.google.com/recaptcha/api/siteverify';
        const post_data = {
            secret: recaptcha_config.secret_key,
            response: token
        };
        const reqOpt = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: enQuery(post_data)
        };
        const response = await fetch(url, reqOpt);
        const results = await response.json();
        console.log('validateRecaptcha ' + results.success);
        return results.success;
    } catch (e) {
        throw new Error('INVALID_RECAPTCHA');
    }
}

async function get_ms_token() {
    const url = 'https://login.microsoftonline.com/' + ms_config.tenant_id + '/oauth2/v2.0/token';
    const scope = 'https://graph.microsoft.com/.default';
    
    const post_data = {
        'grant_type': 'client_credentials',
        'client_id': ms_config.client_id,
        'client_secret': ms_config.client_secret,
        'scope': scope
    };
    const reqOpt = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: enQuery(post_data)
    };
    const response = await fetch(url, reqOpt);
    const results = await response.json();
    console.log(results);
    return results.access_token;
}

async function assignLicense(userEmail, access_token, requestBody) {
    const url = 'https://graph.microsoft.com/v1.0/users/' + userEmail + '/assignLicense';
    var skuId = '';
    for (var subscription of ms_config.subscriptions) {
        if (subscription.name == requestBody.subscription) {
            skuId = subscription.skuId;
            break;
        }
    }
    const post_data = {
        "addLicenses": [{
            "disabledPlans": [],
            "skuId": skuId
        }],
        "removeLicenses": []
    };
    const reqOpt = {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + access_token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(post_data)
    };
    const response = await fetch(url, reqOpt);
    const results = await response.json();
    console.log('assignLicense ' + results);
    
    if (results.error == undefined) {
        return true;
    } else {
        return false;
    }
}

async function createUser(requestBody, access_token) {
    const url = 'https://graph.microsoft.com/v1.0/users';
    const password = password_gen();
    const userEmail = requestBody.username + '@' + requestBody.domain
    const post_data = {
        "accountEnabled": true,
        "displayName": requestBody.displayname,
        "mailNickname": requestBody.username,
        "passwordPolicies": "DisablePasswordExpiration, DisableStrongPassword",
        "passwordProfile": {
            "password": password,
            "forceChangePasswordNextSignIn": true
        },
        "userPrincipalName": userEmail,
        "usageLocation": "CN"
    };
    console.log('createUser data ' + JSON.stringify(post_data, null, '\t'));
    const reqOpt = {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'Authorization': 'Bearer ' + access_token
        },
        body: JSON.stringify(post_data)
    };
    const response = await fetch(url, reqOpt);
    const results = await response.json();
    console.log(results);
    if (results.error != undefined) {
        if (results.error.message == 'Another object with the same value for property userPrincipalName already exists.') {
            // return {
            //     stat: 'username exists'
            // };
            throw new Error('USERNAME_EXISTED');
        }
        return results;
    }
    
    if (await assignLicense(userEmail, access_token, requestBody)) {
        const account = {
            stat: 'success',
            email: userEmail,
            password: password
        };
        return account;
    } else {
        const account = {
            stat: JSON.stringify(assign_results)
        };
        return account;
    }
}

async function validateCode(code) {
    try {
        if (process.env.ENV === 'dev') return true;

        const url = `${site_config.api_url}/tokens/check`;
        const data = {
            method: 'POST',
            body: JSON.stringify({
                token: code
            }),
            headers: { 'Content-Type': 'application/json' }
        };

        const response = await fetch(url, data);
        return !!response.ok;
    } catch (e) {
        console.log(e);
        throw new Error('INVALID_CODE');
    }
}

async function deleteCode(code) {
    if (process.env.ENV === 'dev') return true;

    const response = await fetch(site_config.api_url, {
        method: 'POST',
        body: JSON.stringify({
            'action': 'delCode',
            'code': code,
        })
    });
    return await response.text();
}

async function useCode(code) {
    try {
        if (process.env.ENV === 'dev') return true;
        
        const url = `${site_config.api_url}/tokens/use`;
        const data = {
            method: 'POST',
            body: JSON.stringify({
                token: code,
                useFor: 'INDIVIDUAL_CUSTOMER'
            }),
            headers: { 'Content-Type': 'application/json' }
        };

        const response = await fetch(url, data);

        return !!response.ok;
    } catch(e) {
        throw new Error('CODE_HAS_NOT_BEEN_USED');
    }
}

async function createAccountMS(req, res) {
    try {
        const requestBody = req.body;
        if (!await validateRecaptcha(requestBody.grecaptcha_token)) {
            throw new Error('INVALID_RECAPTCHA');
        }
        
        if (await validateCode(requestBody.code)) {
            
            const ms_token = await get_ms_token();
            const account = await createUser(requestBody, ms_token);
            
            if (account.stat == 'success') {
                await useCode(requestBody.code);
            }
            
            return res.status(200).send(account);
        } else {
            throw new Error('INVALID_CODE');
        }
    } catch (e) {
        switch (e.message) {
            case 'INVALID_CODE': {
                return res.status(400).send({
                    stat: 'invalid code'
                });
            }
            
            case 'INVALID_RECAPTCHA': {
                return res.status(400).send({stat: 'wrong recaptcha'});
            }
            
            case 'USERNAME_EXISTED': {
                return res.status(400).send({stat: 'username exists'});
            }
            
            default:
                return res.status(400).send({stat: 'FAILED'});
        }
    }
}

module.exports = {
    createAccountMS
}
