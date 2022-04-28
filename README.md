# APM PARSER

## Pre-conditions
Makes sure to set `testBuildId` and `journeyName` as APM global labels, it is needed to match appropriate transactions.

## Cli usage
```typescript
 yarn cli -u <username> -p <password> -c "https://apm-7-17.es.us-central1.gcp.cloud.es.io:9243" -b "local-90a41a83-90da-487b-a6be-4713a9ad18d8" -n "My cool journey"
```


## Library usage

```typescript
apmParser({
  param: { journeyName: 'My cool journey', buildId: 'local-90a41a83-90da-487b-a6be-4713a9ad18d8'},
  client: { auth: { username: '<username>', password: '<password>' }, baseURL: '<esCLusterUrl>' },
})
    .then(console.info)
    .catch(console.error);
```

