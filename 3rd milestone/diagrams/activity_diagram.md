```mermaid
stateDiagram-v2
    [*] --> LoggedOut
    LoggedOut --> LoggedIn : Login
    LoggedIn --> ViewingDashboard : Success
    ViewingDashboard --> UploadingVideo : Click Upload
    UploadingVideo --> ViewingDashboard : Done
    ViewingDashboard --> ViewingReports : Click Reports
    ViewingReports --> LoggedOut : Logout
```
