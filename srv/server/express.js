'use strict';

module.exports = function (app) {

	let logging = require('@sap/logging')
	let appContext = logging.createAppContext({})
	app.logger = appContext.createLogContext().getLogger('/Application')

	app.set('etag', false)

	require('./healthCheck')(app)
	require('./overloadProtection')(app)
	
	const cors = require('cors')
	app.use(cors())

	require('./expressSecurity')(app)

	require('./swagger')(app)
	app.use(logging.middleware({ appContext: appContext, logNetwork: true }));

}