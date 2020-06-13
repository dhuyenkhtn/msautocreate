const site_config =
    {
        'notice': 'Automatic create Office 365 E3 - Please get activation code before create account!',
        'code_store_link': 'https://zalo.me/0763138666',
        'line1': 'Auto Create Office',
        'line2': 'Sell Office 365 Enterprise',
        'api_url': 'http://api-etms.alhewaytech.com',
    };

const ms_config =
    {
        'tenant_id': '23e47019-e5cb-4a17-923e-ea538a788543',
        'client_id': 'd8d4e572-10cb-4587-abab-568669e6e568',
        'client_secret': 'iTW446RmKrR~-05HcEUo71L_nslqX_5N_L',
        'subscriptions':
            [
                {
                    'name': 'Office 365 Enterprise E1',  //eg. Office 365 A1 for faculty
                    'skuId': '18181a46-0d4e-45cd-891e-60aabd171b4e',
                }
                //{
                //'name': '',
                //'skuId': ''
                //}
            ],
        'domains': ['7upuk.onmicrosoft.com']
    };

const recaptcha_config = {
    'site_key': '6Leh0PoUAAAAAMTmjSd9nFeLE4DPt0jER4hKX6gn',
    'secret_key': '6Leh0PoUAAAAANpfeL6zBlG855pYPh3kgNRhITjY'
};

module.exports = {
    site_config,
    ms_config,
    recaptcha_config
}
