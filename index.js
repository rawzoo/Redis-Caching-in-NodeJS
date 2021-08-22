const express = require('express')
const app = express()
require('dotenv').config()
const port = process.env.PORT || 5000
const redis = require('redis')
const fetch = require('node-fetch')

//Create Redis Connection
const client = redis.createClient({
	host: process.env.REDIS_HOST,
	port: process.env.REDIS_PORT,
	password: process.env.REDIS_PASSWORD
})

//Handle Error with Events
client.on('error',err => {
	console.log('Error '+err)
})

//Show UI on Browser
function setResponse(user,repo) {
	return `<h1>${user} have total number of ${repo}</h1>`
}

//Call API from Public API of Github
const loadRepo = async (req , res,next) =>{
	try {
		
		const {username} = req.params
		const response = await fetch(`https://api.github.com/users/${username}`)
		const data = await response.json()
		const repos = data.public_repos
		client.setex(username,3600,repos)
		console.log('fetching Data from API')
		console.log(data.public_repos)
        res.send(setResponse(username,repos))
			
	} catch(error) {
		console.log(error)
	}
}

//Get the data from Redis
const cache = (req,res,next) => {
	const {username} = req.params

	client.get(username,(err,data) => {
		if(err) throw err;

		if(data!==null){
			console.log('data from Redis')
			res.send(setResponse(username,data))
		} else {
			next()
		}
	})
}

//End Point GET /repos/:username
app.get('/repos/:username',cache,loadRepo)

app.listen(port , ()=> console.log('> Server is up and running on port : ' + port))