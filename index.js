/*
* Copyright 2019 Joachim Bakke
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/


const util = require('util');
const request = require('request');
//const _ = require('lodash');

var regularCheck
var commandOn
var tasmotaPowerOn


module.exports = function(app, options) {
  'use strict';
  var client;
  var context = "vessels.self";

  return {
    id: "signalk-tasmota",
    name: "Control Sonoff with Tasmota",
    description: "Control a Tasmota unit with a Signal K path",

    schema: {
      title: "Control Sonoff with Tasmota",
      type: "object",
      required: [
        "pathToCommand",
        "tasmotaUrl"
      ],
      properties: {
        pathToCommand: {
          type: "string",
          title: "Signal K path to boolean 'commandCharge' or similar",
          default: "electrical.batteries.House.commandCharge"
        },
        tasmotaUrl: {
          type: "string",
          format: "uri",
          title: "URL to tasmota unit"
        },
        passwordProtected: {
          type: "boolean",
          title: "password protected Tasmota"
        },
        tasmotaUser: {
          type: "string",
          title: "user name for Tasmota (optional)"
        },
        tasmotaPasswd: {
          type: "string",
          format: "",
          title: "password for Tasmota (optional)"
        }
      }
    },

    start: function(options) {
      app.setProviderStatus("Started")

      regularCheck = setInterval(function(){
        app.debug("checking for command")
        if (app.streambundle.getAvailablePaths().includes(options.pathToCommand)){
          app.setProviderStatus("Started, found command")
          app.debug("Started, found command")
          var commandOn = app.getSelfPath(options.pathToCommand + ".value")
          app.debug(commandOn)
          var tasmotaUrl = options.tasmotaUrl + "/cm?"
          if (options.passwordProtected){
            tasmotaUrl = tasmotaUrl + "/cm?&user=" + options.tasmotaUser + "&password=" + options.tasmotaPasswd + "&"
          }
          request(tasmotaUrl + "cmnd=Status", { json: true }, (err, res, body) => {
            if (err) {
              return console.log(err);
            } else if (!err && res.statusCode == 200) {
              //app.debug(res);
              app.debug(res.Status.Power);
              if (res.Status.Power = 0){
                tasmotaPowerOn = false
              } else {
                tasmotaPowerOn = true
              }
              if (tasmotaPowerOn != commandOn){
                request(options.tasmotaUrl + "cmnd=Power%20TOGGLE", { json: true }, (err, res, body) => {
                  if (err) {
                    return app.debug(err);
                  } else if (!err && res.statusCode == 200) {
                  app.debug(res);
                }
                })
              }
            }
          });

        } else {
          app.setProviderError("could not find " + options.pathToCommand)
          app.debug("could not find " + options.pathToCommand)
        }
      }, 1000);

    },
    stop: function() {
      app.setProviderStatus("Stopped")
      clearInterval(regularCheck)
    }
  }
}
