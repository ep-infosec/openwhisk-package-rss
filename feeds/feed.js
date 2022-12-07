/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var request = require('request');

function main(msg){
    // whisk trigger in payload
    var trigger = parseQName(msg.triggerName);

    var lifecycleEvent = msg.lifecycleEvent || 'CREATE';

    if (lifecycleEvent === 'CREATE'){

        var newTrigger = {
            name: trigger.name,
            namespace: trigger.namespace,
            pollingInterval: msg.pollingInterval,
            url: msg.url,
            filter:msg.filter,
            whiskhost: msg.apiHost
        };

        var promise = new Promise(function (resolve, reject) {
            request({
                method: "POST",
                uri: msg.provider_endpoint,
                json: newTrigger,
                auth: {
                    user: msg.authKey.split(':')[0],
                    pass: msg.authKey.split(':')[1]
                }
            }, function(err, res, body) {
                console.log('rss: done http request');
                if (!err && res.statusCode === 200) {
                    resolve({
                        response:res,
                        body:body
                        });
                }
                else {
                    if(res) {
                        console.log('rss: Error invoking whisk action:', res.statusCode, body);
                        reject({
                            statusCode:res.statusCode,
                            response:res
                        });
                    }
                    else {
                        console.log('rss: Error invoking whisk action:', err);
                        reject({
                            error:err
                        });
                    }
                }
            });
        });
        return promise;
    } else if (lifecycleEvent === 'DELETE'){

        var trigger = {
            name: trigger.name,
            namespace: trigger.namespace
        }
        var promise = new Promise(function ( resolve, reject){
            request({
                method: "DELETE",
                uri: msg.provider_endpoint,
                json: trigger,
                auth: {
                    user: msg.authKey.split(':')[0],
                    pass: msg.authKey.split(':')[1]
                }
            }, function(err, res, body) {
                console.log('rss: done http request');
                if (!err && (res.statusCode === 200 || res.statusCode === 404)) {
                    resolve({
                       response:res,
                        body:body
                    });
                }
                else {
                    if(res) {
                        console.log('rss: Error invoking whisk action:', res.statusCode, body);
                        reject({
                           statusCode:res.statusCode,
                            response:res
                        });
                    }
                    else {
                        console.log('rss: Error invoking whisk action:', err);
                        reject({
                             error:err
                            });
                    }
                }
            });
        });
        return promise;
    }

    function parseQName(qname) {
        var parsed = {};
        var delimiter = '/';
        var defaultNamespace = '_';
        if (qname && qname.charAt(0) === delimiter) {
            var parts = qname.split(delimiter);
            parsed.namespace = parts[1];
            parsed.name = parts.length > 2 ? parts.slice(2).join(delimiter) : '';
        } else {
            parsed.namespace = defaultNamespace;
            parsed.name = qname;
        }
        return parsed;
    }
}
