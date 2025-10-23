# Audit Logging System Documentation

## Overview
The blockchain voting system now includes comprehensive audit logging that tracks all user activities, authentication events, blockchain transactions, and administrative actions in the `audit_logs` table.

## Database Schema
The `audit_logs` table includes:
- **id**: Primary key
- **userId**: User who performed the action (nullable for system events)
- **action**: Type of action performed (e.g., USER_LOGIN_SUCCESS, VOTE_CAST)
- **entityType**: Type of entity affected (user, vote, wallet, election, etc.)
- **entityId**: ID of the affected entity
- **oldValues**: JSON field storing previous values (for updates)
- **newValues**: JSON field storing new values
- **ipAddress**: IP address of the request
- **userAgent**: Browser/client information
- **createdAt**: Timestamp of when the action occurred

## Automatic Logging

### All API Requests
Every API request is automatically logged with:
- HTTP method and path
- Response status code
- User ID (if authenticated)
- IP address and user agent

### Authentication Events
The following auth events are automatically logged:
- `USER_REGISTER` - New user registration
- `USER_LOGIN_SUCCESS` - Successful login
- `USER_LOGIN_FAILED` - Failed login attempt
- `USER_LOGOUT` - User logout
- `OTP_VERIFY_SUCCESS` - OTP verification successful
- `OTP_VERIFY_FAILED` - OTP verification failed
- `PASSWORD_CHANGE` - Password changed/reset

### Profile & Wallet Events
- `PROFILE_UPDATE` - User profile updated
- `WALLET_REGISTER` - Wallet address registered
- `WALLET_VERIFY` - Wallet verification attempt

### Blockchain Events (to be added)
- `VOTE_CAST` - Vote cast on blockchain
- `CANDIDATE_ADD` - New candidate added
- `ELECTION_OPEN` - Election opened
- `ELECTION_CLOSE` - Election closed
- `VOTER_REGISTER_BLOCKCHAIN` - Voter registered on blockchain

## API Endpoints

### View Audit Logs (Admin Only)
```
GET /api/audit-logs
Query Parameters:
- userId: Filter by user ID
- action: Filter by action type
- entityType: Filter by entity type
- entityId: Filter by entity ID
- startDate: Start date for date range
- endDate: End date for date range
- limit: Number of records (default: 50)
- offset: Pagination offset (default: 0)

Response:
{
  "success": true,
  "data": {
    "logs": [...],
    "filters": {...},
    "pagination": {...}
  }
}
```

### View Audit Statistics (Admin Only)
```
GET /api/audit-logs/statistics
Query Parameters:
- startDate: Start date (optional)
- endDate: End date (optional)

Response:
{
  "success": true,
  "data": {
    "totalLogs": 1234,
    "topActions": [
      { "action": "USER_LOGIN_SUCCESS", "count": 450 },
      { "action": "VOTE_CAST", "count": 320 }
    ],
    "entityTypeBreakdown": [
      { "entityType": "user", "count": 500 },
      { "entityType": "vote", "count": 320 }
    ]
  }
}
```

### View User's Own Activity
```
GET /api/audit-logs/my-activity
Query Parameters:
- limit: Number of records (default: 50)
- offset: Pagination offset (default: 0)

Response:
{
  "success": true,
  "data": {
    "logs": [...],
    "pagination": {...}
  }
}
```

### View Specific User's Logs (Admin or Own)
```
GET /api/audit-logs/user/:userId
Query Parameters:
- limit: Number of records (default: 50)
- offset: Pagination offset (default: 0)
```

## Manual Logging

### In Your Code
You can manually log events using the AuditService:

```javascript
const AuditService = require('../services/auditService');

// Log authentication event
await AuditService.logAuth('CUSTOM_ACTION', userId, req, { additionalData: 'value' });

// Log vote
await AuditService.logVote(userId, candidateId, transactionHash, req);

// Log candidate addition
await AuditService.logCandidateAdd(userId, candidateName, candidateId, req);

// Log election state change
await AuditService.logElectionStateChange(userId, 'ELECTION_OPEN', electionId, req);

// Log voter registration
await AuditService.logVoterRegistration(userId, walletAddress, transactionHash, req);

// Log wallet operation
await AuditService.logWalletOperation('WALLET_UPDATE', userId, walletAddress, req, { extra: 'data' });

// Log profile update
await AuditService.logProfileUpdate(userId, oldData, newData, req);

// Log error
await AuditService.logError(userId, 'ACTION_NAME', error, req);

// Log admin action
await AuditService.logAdminAction('ADMIN_USER_DELETE', adminId, 'user', targetUserId, req, details);
```

## Security & Privacy

### IP Address Tracking
- IP addresses are logged for security audit purposes
- In production, ensure GDPR compliance if operating in EU

### User Agent Logging
- Browser/client information is stored for detecting suspicious activity

### Admin Access
- Only users with `super_admin` or `election_admin` roles can view all logs
- Regular users can only view their own activity logs

### Data Retention
- Consider implementing a data retention policy
- Old logs can be archived or deleted based on compliance requirements

## Integration with Voting System

### Adding Blockchain Vote Logging
When a vote is cast in your VotingPage, add this to the backend endpoint:

```javascript
// After successful vote transaction
await AuditService.logVote(
  req.user.userId,
  candidateId,
  transactionHash,
  req
);
```

### Adding Election Management Logging
When opening/closing elections:

```javascript
// Open election
await AuditService.logElectionStateChange(
  req.user.userId,
  'ELECTION_OPEN',
  electionId,
  req,
  { transactionHash }
);

// Close election
await AuditService.logElectionStateChange(
  req.user.userId,
  'ELECTION_CLOSE',
  electionId,
  req,
  { transactionHash }
);
```

## Testing

### Check Logs After Actions
1. Register a new user
2. Login
3. Update profile
4. Connect wallet
5. View logs at `/api/audit-logs/my-activity`

### Admin Testing
1. Login as admin (admin@votingsystem.com / Admin123!)
2. View all logs at `/api/audit-logs`
3. View statistics at `/api/audit-logs/statistics`

## Monitoring & Alerts

### Failed Login Attempts
Query for multiple `USER_LOGIN_FAILED` from the same IP to detect brute force attacks:

```sql
SELECT ipAddress, COUNT(*) as attempts
FROM audit_logs
WHERE action = 'USER_LOGIN_FAILED'
  AND createdAt > DATE_SUB(NOW(), INTERVAL 1 HOUR)
GROUP BY ipAddress
HAVING attempts > 5;
```

### Suspicious Activity
Monitor for unusual patterns:
- Multiple votes from same IP
- Rapid profile changes
- Unauthorized admin access attempts

## Future Enhancements

1. **Real-time Alerts**: Set up webhooks or email alerts for critical events
2. **Log Export**: Add CSV/JSON export functionality
3. **Log Visualization**: Create dashboard for log analytics
4. **Blockchain Verification**: Cross-reference logs with blockchain events
5. **Anomaly Detection**: ML-based detection of suspicious patterns

## Troubleshooting

### Logs Not Appearing
1. Check database connection
2. Verify `audit_logs` table exists
3. Check server console for audit logging errors
4. Ensure models are properly synced

### Permission Errors
1. Verify user role in database
2. Check JWT token is valid
3. Ensure admin middleware is working

---

**Note**: Audit logging is designed to never break your application. If logging fails, it's caught and logged to console without affecting the main operation.
