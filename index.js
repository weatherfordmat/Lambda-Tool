#! /usr/bin/env node

const AWS = require('aws-sdk');
const fs = require('fs');
const colors = require('colors');
const inquirer = require('inquirer');

// general config
AWS.config.update({ region: 'us-east-1' })

// lambda constructor
const lambda = new AWS.Lambda({apiVersion: '2015-03-31'})

/*
@param 
	{func} service: the sub-constructor used in the sdk.
	{method} method: the method of the constructor.
	{object} config: any configuration variables
*/
const handler = (service, method, config = {}) => {
  return new Promise((resolve, reject) => {
    service[method](config, (err, result) => {
      if (err) reject(err);
      else {
        resolve(result);
      }
    })
  })
    .then(data => {
        console.log(data);
        writeToLog(JSON.stringify(data));
    })
    .catch(err => {
        console.log(err);
        writeToLog(JSON.stringify(err.message));
    })
}

/*
@param 
	{str} string
    keeps a log of our past deployments;
*/
const writeToLog = (str) => {
    str = `\n${new Date().toISOString()}: ${str}\n`;
    fs.appendFile('deploy.log', str, function (err) {
    if (err) throw err;
    console.log('Details can be found in the deploy.log file'.yellow);
    });
}


/*
@param 
	{description} string
	{name} string
	{zip} string: pathname
	{handler} string
	{memory} int
	{timeout} int < 30
*/
const getParams = (description, name, zip = 'index.zip', handler = 'index.handler', memory = 128, timeout = 3) => {
  const params = {
    Code: {
      ZipFile: fs.readFileSync(zip)
    },
    Description: description,
    FunctionName: name,
    Handler: handler,
    MemorySize: memory,
    Publish: true,
    Role: 'arn:aws:iam::778741603053:role/lambdaFull',
    Runtime: 'nodejs6.10',
    Timeout: timeout
  }
  return params
}

/*
@param 
	{folder} string: the dir or js file to zip;
*/
const betterZip = (folder='src') => {
  var archive = archiver('zip');
  return new Promise((resolve, reject) => {
  var output = fs.createWriteStream('index.zip', { mode: 0o7777 })
  output.on('close', function () {
    console.log('Files Have Been zipped'.green);
    resolve();
  })

  // good practice to catch this error explicitly
  archive.on('error', function (err) {
    reject(err);
  });

const unlink = (filePath) => {
    fs.unlink(filePath, (err) => {
        if (err) throw err;
        console.log('Deleted Zip File'.underline.yellow)
    });
}


/*
@param
    {func} function
	wraps the functions in a try, catch block;
*/
const block = (func) => {
    try {
        func;
    } catch(e) {
        console.error(e);
        writeToLog(e);
    }
}

/*
@param
    {where} string
	{description} string
	{name} string
*/
const createNewFunction = async (where, descr, name) => {
	await zip(where);
	await handler(lambda, "createFunction", getParams(descr, name));
    await unlink('index.zip');
	// list all functions.
	await handler(lambda, "listFunctions");
}

// our main method;
// block(createNewFunction('./index.js', 'This is our first deployment from the aws-sdk', 'Test_Function'));

inquirer.prompt([
    {
        type: 'input',
        name: 'functionName',
        message: 'Function Name: ',
    },
    {
        type: 'input',
        name: 'functionDescription',
        message: 'Description: '
    }
]).then(function (answers) {
    console.log(answers);
});