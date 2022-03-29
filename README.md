# APM PARSER

```typescript
apmParser({
    start: '2022-03-29T01:20:00.000Z',
    end: '2022-03-29T18:25:00.000Z',
    environment: Environment.ENVIRONMENT_ALL,
    kuery: 'labels.testJobId:local-9bb12252-f167-45c4-8a34-8158fa4bc8d5',
})
    .then(console.info)
    .catch(console.error);
```

