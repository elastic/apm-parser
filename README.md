# APM PARSER

## Cli usage
```typescript
yarn cli -u <username> -p <password> -c "https://apm-7-17.es.us-central1.gcp.cloud.es.io:9243" -s 2022-04-12T00:01:00.000Z -j local-90a41a83-90da-487b-a6be-4713a9ad18d8 -n 'My cool journey'
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

