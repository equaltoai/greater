# Lesser GraphQL API Documentation

## Overview

Lesser provides a modern GraphQL API alongside its Mastodon-compatible REST API. The GraphQL API offers advanced analytics, federation insights, and real-time subscriptions.

**Endpoint**: `https://your-instance.com/graphql`  
**Authentication**: Bearer token in Authorization header  
**WebSocket**: `wss://your-instance.com/graphql` (for subscriptions)

## Schema Overview

### Core Operations
- **60+ GraphQL operations** (queries, mutations, subscriptions)
- **Federation analytics** with real-time insights
- **Performance monitoring** queries
- **Advanced moderation** interface
- **Cost tracking** on all operations

### Key Features
- **DataLoader integration** prevents N+1 queries
- **Real-time subscriptions** via WebSocket
- **Cost attribution** per operation
- **Federation graph visualization** data
- **Advanced analytics** queries

## Authentication

```graphql
# All requests require Bearer token
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## Core Queries

### User and Account Data
```graphql
query GetUser($username: String!) {
  user(username: $username) {
    id
    username
    displayName
    avatar
    header
    note
    followersCount
    followingCount
    statusesCount
    trustScore {
      score
      confidence
      category
    }
  }
}
```

### Timeline and Status Queries
```graphql
query GetTimeline($type: TimelineType!, $limit: Int, $cursor: String) {
  timeline(type: $type, limit: $limit, cursor: $cursor) {
    statuses {
      id
      content
      createdAt
      author {
        username
        displayName
        avatar
      }
      mediaAttachments {
        id
        type
        url
        previewUrl
      }
      metrics {
        repliesCount
        reblogsCount
        favoritesCount
      }
    }
    nextCursor
    totalCost
  }
}
```

## Phase 3 Advanced Features

### Federation Analytics
```graphql
query GetFederationGraph($depth: Int) {
  federationGraph(depth: $depth) {
    nodes {
      domain
      instanceType
      software
      userCount
      statusCount
      lastSeen
      health
      connections {
        targetDomain
        connectionType
        strength
        volumeIn
        volumeOut
      }
    }
    clusters {
      id
      size
      density
      instances
    }
  }
}

query GetInstanceRelationships($domain: String!) {
  instanceRelationships(domain: $domain) {
    domain
    relationships {
      targetDomain
      connectionType
      strength
      volumeIn
      volumeOut
      sharedUsers
      lastActivity
    }
    recommendations {
      action
      description
      potentialSavings
    }
  }
}
```

### Media Streaming Analytics
```graphql
query GetStreamingAnalytics($mediaId: String!) {
  streamingAnalytics(mediaId: $mediaId) {
    viewCount
    bandwidthUsed
    qualityBreakdown {
      quality
      views
      bytes
    }
    geographicData {
      region
      views
      bytes
    }
    averageWatchTime
    peakConcurrent
    bufferingEvents
  }
}

query GetBandwidthReport($period: String!, $start: DateTime!, $end: DateTime!) {
  bandwidthReport(period: $period, start: $start, end: $end) {
    totalBytes
    totalCost
    byMedia {
      mediaId
      bytes
      cost
      uniqueUsers
    }
    byQuality {
      quality
      bytes
    }
    byRegion {
      region
      bytes
      cost
    }
    recommendations {
      type
      description
      potentialSavings
      priority
    }
  }
}
```

### Performance Monitoring
```graphql
query GetPerformanceMetrics($timeRange: TimeRange!) {
  performanceMetrics(timeRange: $timeRange) {
    lambdaMetrics {
      functionName
      avgDuration
      coldStarts
      errorRate
      invocations
    }
    databaseMetrics {
      readCapacity
      writeCapacity
      throttling
      slowQueries {
        operation
        duration
        table
      }
    }
    federationMetrics {
      domain
      avgLatency
      errorRate
      volume
    }
  }
}
```

### Advanced Moderation
```graphql
query GetModerationQueue($filter: ModerationFilter) {
  moderationQueue(filter: $filter) {
    items {
      id
      contentId
      contentType
      flaggedAt
      priority
      category
      severity
      aiAnalysis {
        score
        confidence
        reasons
      }
      patternMatches {
        patternId
        confidence
        description
      }
    }
    totalCount
    averageProcessingTime
  }
}

mutation CreateModerationPattern($pattern: ModerationPatternInput!) {
  createModerationPattern(pattern: $pattern) {
    id
    type
    severity
    active
    effectiveness {
      matches
      falsePositives
      accuracy
    }
  }
}
```

## Real-time Subscriptions

### WebSocket Connection
```javascript
const wsClient = new WebSocket('wss://your-instance.com/graphql', ['graphql-ws']);
```

### Available Subscriptions
```graphql
# Real-time moderation events
subscription ModerationEvents($filter: ModerationFilter) {
  moderationEvents(filter: $filter) {
    type
    contentId
    severity
    flaggedAt
    aiAnalysis {
      score
      reasons
    }
  }
}

# Performance alerts
subscription PerformanceAlerts($severity: AlertSeverity) {
  performanceAlerts(severity: $severity) {
    type
    service
    metric
    value
    threshold
    timestamp
  }
}

# Federation events
subscription FederationEvents {
  federationEvents {
    type
    sourceDomain
    targetDomain
    activity
    timestamp
  }
}

# Bandwidth monitoring
subscription BandwidthEvents {
  bandwidthEvents {
    mediaId
    bytes
    quality
    region
    timestamp
    costImpact
  }
}
```

## User Preferences

### Streaming Preferences
```graphql
query GetStreamingPreferences($username: String!) {
  streamingPreferences(username: $username) {
    defaultQuality
    autoQuality
    preloadNext
    dataSaverMode
    preferredCodec
    maxBandwidthMbps
    bufferSizeSeconds
    deviceSpecific {
      deviceId
      overrides {
        quality
        codec
        bandwidth
      }
    }
  }
}

mutation UpdateStreamingPreferences($preferences: StreamingPreferencesInput!) {
  updateStreamingPreferences(preferences: $preferences) {
    success
    version
    conflicts {
      field
      strategy
    }
  }
}
```

## Cost Tracking

Every GraphQL operation returns cost information:

```graphql
query ExampleQuery {
  timeline {
    statuses {
      id
      content
    }
    # Cost tracking automatically included
    operationCost {
      totalMicros
      breakdown {
        dynamodb: 150
        lambda: 50
        s3: 25
      }
    }
  }
}
```

## Error Handling

GraphQL errors follow standard format with enhanced context:

```json
{
  "errors": [
    {
      "message": "Insufficient permissions for federation analytics",
      "locations": [{"line": 2, "column": 3}],
      "path": ["federationGraph"],
      "extensions": {
        "code": "PERMISSION_DENIED",
        "costMicros": 10,
        "retryAfter": 60
      }
    }
  ]
}
```

## Rate Limiting

- **Authenticated**: 300 requests per 5 minutes
- **Unauthenticated**: 100 requests per 5 minutes  
- **WebSocket subscriptions**: 10 concurrent per user
- **Cost limits**: $1.00 per hour per user

## Schema Introspection

```graphql
query IntrospectionQuery {
  __schema {
    types {
      name
      description
      fields {
        name
        type {
          name
        }
      }
    }
  }
}
```

## Best Practices

1. **Use DataLoader patterns** - Batch related queries
2. **Specify only needed fields** - Reduce response size and cost
3. **Implement subscription cleanup** - Close WebSocket connections properly
4. **Monitor cost headers** - Track operation costs
5. **Cache static data** - Federation graphs change slowly
6. **Use fragments** - Reuse common field selections

## Example Implementation

```javascript
import { ApolloClient, InMemoryCache, split, HttpLink } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

const httpLink = new HttpLink({
  uri: 'https://your-instance.com/graphql',
  headers: {
    Authorization: `Bearer ${accessToken}`
  }
});

const wsLink = new GraphQLWsLink(createClient({
  url: 'wss://your-instance.com/graphql',
  connectionParams: {
    Authorization: `Bearer ${accessToken}`
  }
}));

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink,
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache()
});
```

---

**Note**: This GraphQL API is part of Lesser's Phase 3 implementation, providing advanced analytics and real-time capabilities beyond the standard Mastodon API. All features are production-ready with comprehensive cost tracking and monitoring.