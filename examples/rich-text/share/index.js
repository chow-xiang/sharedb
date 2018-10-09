'use strict'

const agent = require('../agent')
const DocAgent = require('./doc')


class ShareAgent {
	constructor (backend){
		this.docAgents = {}
		this.backend = backend
	}

	get (docId){
		if ( !this.docAgents[docId] ) {
			this.docAgents[docId] = new DocAgent(docId, this.backend)
		}
		return this.docAgents[docId]
	}
}

module.exports = ShareAgent
