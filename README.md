# APM PARSER

## Cli usage
```typescript
yarn cli -u elastic -p <pswd> -c "https://apm-7-17.es.us-central1.gcp.cloud.es.io:9243" -s 2022-04-12T00:01:00.000Z -j local-4286bbf1-e956-434c-a19b-7f1d19b8fc6d
```


## Library usage

```typescript
apmParser({
    start: '2022-04-12T00:01:00.000Z',
    jobId: 'local-90a41a83-90da-487b-a6be-4713a9ad18d8',
})
    .then(console.info)
    .catch(console.error);
```

