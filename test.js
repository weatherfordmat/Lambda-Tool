#! /usr/bin/env node

/*
simulates a testing environment
for our lambda function
*/

// must get the current workign directory;
var dir = process.cwd();
const handler = require(dir+'/src/index.js').handler;

// formats output;
var Table = require('cli-table');
var table = new Table();

let event = {};
event.lambda = "output";

// copies the syntax of lambda callback;
function callback() {
   let args = [].slice.call(arguments);
   if (args[0]) {
       console.log(args[0]);
       return;
   } else {
       args.shift();
       let event = args[0];
       for (i in event) {
            table.push([i, event[i]]);
       }
       console.log(table.toString());
       return;
   }
}

// adding some fake functionality to the context object;
let context = {};
context.getRemainingTimeInMillis = function () {
    return 300;
}
context.functionName = 'handler';
context.functionVersion = 'latest';
context.invokedFunctionArn = 'arn:********';
context.memoryLimitInMB = 128;
context.awsRequestId = '******';
context.logGroupName = 'test';
context.logStreamName = 'testing';
context.identity = {};
context.clientContext = {};


handler(event, context, callback);
