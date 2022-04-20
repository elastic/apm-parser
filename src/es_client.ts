/* eslint-disable require-jsdoc */
import {Client} from '@elastic/elasticsearch';

interface clientOptions {
  node: string,
  username: string,
  password: string,
}

export function initClient(options: clientOptions) {
  const client = new Client({
    node: options.node,
    auth: {
      username: options.username,
      password: options.password
    }
});

    return {
      getTransactions: async function(jobId: string, startTime: string){
        const result = await client.search({
          "body": {
            "track_total_hits": true,
            "sort": [
              {
                "@timestamp": {
                  "order": "desc",
                  "unmapped_type": "boolean"
                }
              }
            ],
            "size": 10000,
            "stored_fields": [
              "*"
            ],
            "_source": true,
            "query": {
              "bool": {
                "must": [],
                "filter": [
                  {
                    "bool": {
                      "filter": [
                        {
                          "bool": {
                            "should": [
                              {
                                "match_phrase": {
                                  "transaction.type": "request"
                                }
                              }
                            ],
                            "minimum_should_match": 1
                          }
                        },
                        {
                          "bool": {
                            "should": [
                              {
                                "match_phrase": {
                                  "processor.event": "transaction"
                                }
                              }
                            ],
                            "minimum_should_match": 1
                          }
                        },
                        {
                          "bool": {
                            "should": [
                              {
                                "match_phrase": {
                                  "labels.testJobId": jobId
                                }
                              }
                            ],
                            "minimum_should_match": 1
                          }
                        }
                      ]
                    }
                  },
                  {
                    "range": {
                      "@timestamp": {
                        "format": "strict_date_optional_time",
                        "gte": startTime
                      }
                    }
                  }
                ],
                "should": [],
                "must_not": []
              }
            }
          }
        })
        return result?.body?.hits?.hits;
      }
    }
}

