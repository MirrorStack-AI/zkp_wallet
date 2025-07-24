# MirrorStack Wallet - UML Diagrams

## 🏗️ Class Diagram

```mermaid
classDiagram
    class BrowserExtension {
        +initialize()
        +showWelcomeScreen()
        +showRegistrationForm()
        +showRestoreForm()
        +showSeedPhraseDisplay()
        +showSecurityCheck()
        +showDeviceFingerprinting()
        +showBiometricLoading()
        +showBiometricFailed()
        +showZKPLoading()
        +showZKPAuthentication()
        +showZKPSuccess()
        +showMainDashboard()
        +showSettings()
        +handleUserAction()
    }

    class BackgroundScript {
        +checkUserExists()
        +handleRegistration()
        +handleRestoration()
        +initiateSecurityCheck()
        +handleDeviceFingerprinting()
        +handleBiometricAuth()
        +initiateZKP()
        +manageSession()
        +handleLogout()
        +getHSMStatus()
    }

    class HSM {
        +initialize()
        +generateKeyPair()
        +storePrivateKey(key)
        +encryptData(data, salt)
        +decryptData(encryptedData, salt)
        +generateDeviceHash(deviceData)
        +verifyBiometric(biometricData)
        +generateZKPProof(challenge)
        +clearSession()
        +getStatus()
    }

    class ZKPClientService {
        +registerUser(email, username)
        +authenticateUser()
        +generateProof(challenge)
        +verifyDeviceFingerprint(deviceHash)
        +verifyBiometricAuth(biometricData)
        +signTransaction(transaction)
        +logout()
    }

    class ZKPService {
        +generateChallenge()
        +verifyProof(proof)
        +verifyDeviceFingerprint(deviceHash)
        +verifyBiometricAuth(biometricData)
        +generateSessionToken()
        +invalidateSession()
    }

    class SecureStorage {
        +storePrivateKey(key)
        +storeSeedPhrase(phrase)
        +storeSessionData(data)
        +storeSalt(salt)
        +retrieveCredentials()
        +clearSession()
        +encryptData(data)
        +decryptData(encryptedData)
        +storeDeviceFingerprint(fingerprint)
    }

    class SeedPhraseManager {
        +generateSeedPhrase()
        +validateSeedPhrase(phrase)
        +deriveKeys(phrase, salt)
        +exportSeedPhrase(phrase)
        +splitIntoFiles(encryptedData)
        +addIntegrityChecksums(files)
    }

    class DeviceFingerprinter {
        +collectDeviceData()
        +generateDeviceHash(deviceData)
        +validateDeviceFingerprint(fingerprint)
        +requestPermission()
    }

    class BiometricAuthenticator {
        +detectPlatform()
        +requestBiometricAuth()
        +verifyBiometric(biometricData)
        +handleBiometricFailure()
        +getBiometricStatus()
    }

    class BlockchainInterface {
        +queryBalance(address)
        +submitTransaction(transaction)
        +estimateGas(transaction)
        +getTransactionStatus(hash)
    }

    class SettingsManager {
        +getHSMStatus()
        +getBiometricStatus()
        +getDeviceFingerprintStatus()
        +updateSecuritySettings()
        +clearSession()
    }

    BrowserExtension --> BackgroundScript
    BackgroundScript --> HSM
    BackgroundScript --> ZKPClientService
    BackgroundScript --> SecureStorage
    BackgroundScript --> SeedPhraseManager
    BackgroundScript --> DeviceFingerprinter
    BackgroundScript --> BiometricAuthenticator
    BackgroundScript --> BlockchainInterface
    BackgroundScript --> SettingsManager
    ZKPClientService --> ZKPService
    ZKPClientService --> SecureStorage
    SeedPhraseManager --> SecureStorage
    DeviceFingerprinter --> HSM
    BiometricAuthenticator --> HSM
    SettingsManager --> HSM
```

## 🔄 Activity Diagram - Complete User Journey

```mermaid
flowchart TD
    A[User Opens Extension] --> B{User Exists?}
    B -->|No| C[Show Welcome Screen]
    B -->|Yes| D[Show Main Dashboard]
    
    C --> E{User Choice}
    E -->|Create Account| F[Show Registration Form]
    E -->|Restore Account| G[Show Restore Form]
    
    F --> H[User Enters Email & Username]
    H --> I[Submit Registration Data]
    I --> J[Generate Seed Phrase]
    J --> K[Display Seed Phrase]
    K --> L[User Acknowledges Storage]
    L --> M[Store Encrypted Data]
    
    G --> N[User Enters Seed Phrase]
    N --> O[Validate Seed Phrase]
    O --> P{Valid?}
    P -->|No| Q[Show Error & Retry]
    P -->|Yes| R[Derive Keys]
    Q --> N
    
    M --> S[Start Security Check]
    R --> S
    
    S --> T[Show Security Checking Screen]
    T --> U[Request Device Fingerprinting Permission]
    U --> V[Collect Device Data]
    V --> W[Generate Device Hash with HSM]
    W --> X[Submit Device Fingerprint]
    X --> Y{Device Valid?}
    Y -->|No| Z[Show Error & Retry]
    Y -->|Yes| AA[Show Biometric Loading]
    Z --> U
    
    AA --> BB[Show Biometric Authentication]
    BB --> CC[Request Biometric Auth]
    CC --> DD[Verify Biometric with HSM]
    DD --> EE{Biometric Valid?}
    EE -->|No| FF[Show Biometric Failed Screen]
    EE -->|Yes| GG[Start ZKP Authentication]
    FF --> HH[User Clicks Retry]
    HH --> BB
    
    GG --> II[Show ZKP Loading Screen]
    II --> JJ[Request Challenge]
    JJ --> KK[Generate ZKP Proof with HSM]
    KK --> LL[Submit Proof]
    LL --> MM{Proof Valid?}
    MM -->|No| NN[Show Error & Retry]
    MM -->|Yes| OO[Generate Session Token]
    NN --> GG
    
    OO --> PP[Show Main Dashboard]
    PP --> QQ[Display User Info with HSM Status]
    QQ --> RR[Show Wallet Features]
    RR --> SS[Handle User Actions]
    SS --> TT{User Action}
    TT -->|Transaction| UU[Sign Transaction with HSM]
    TT -->|Settings| VV[Show Settings Screen]
    TT -->|Logout| WW[Clear Session]
    
    UU --> XX[Submit to Blockchain]
    XX --> YY[Show Confirmation]
    YY --> PP
    
    VV --> ZZ[Display Security Settings]
    ZZ --> PP
    
    WW --> AAA[Return to Welcome]
    
    D --> SS
```

## 🎯 Use Case Diagram

```mermaid
graph TB
    subgraph "User"
        A[👤 New User]
        B[👤 Returning User]
        C[👤 Authenticated User]
    end
    
    subgraph "Primary Use Cases"
        D[Create Account]
        E[Restore Account]
        F[Security Check]
        G[Device Fingerprinting]
        H[Biometric Authentication]
        I[Authenticate with ZKP]
        J[Access Wallet Dashboard]
        K[Manage Security Settings]
        L[Perform Transactions]
        M[Logout]
    end
    
    subgraph "Secondary Use Cases"
        N[Download Seed Phrase]
        O[Toggle Theme]
        P[View Transaction History]
        Q[Export Wallet Data]
        R[Monitor HSM Status]
    end
    
    A --> D
    A --> E
    B --> E
    C --> J
    C --> K
    C --> L
    C --> M
    C --> N
    C --> O
    C --> P
    C --> Q
    C --> R
    
    D --> F
    E --> F
    F --> G
    G --> H
    H --> I
    I --> J
```

## 🔐 Security Sequence Diagram

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant UI as 🎨 UI Layer
    participant Auth as 🔐 Auth Service
    participant HSM as 🛡️ Hardware Security Module
    participant Crypto as 🔑 Crypto API
    participant Storage as 💾 Secure Storage
    participant ZKP as 🛡️ ZKP Service
    participant Blockchain as ⛓️ Blockchain

    Note over User, Blockchain: Registration Security Flow
    User->>UI: Enter Registration Data
    UI->>Auth: Submit Registration
    Auth->>HSM: Initialize HSM
    HSM-->>Auth: HSM Ready
    Auth->>Crypto: Generate Key Pair
    Crypto->>Auth: Return Public/Private Keys
    Auth->>HSM: Store Private Key Securely
    HSM-->>Auth: Private Key Stored
    Auth->>Crypto: Generate Seed Phrase
    Crypto->>Auth: Return Seed Phrase
    Auth->>HSM: Encrypt Private Data with Salt
    HSM->>Auth: Return Encrypted Data
    Auth->>Storage: Store Encrypted Data
    Storage-->>Auth: Confirmation
    Auth-->>UI: Registration Success
    UI->>User: Show Seed Phrase

    Note over User, Blockchain: Security Check Flow
    User->>UI: Start Security Check
    UI->>Auth: Request Security Check
    Auth->>UI: Show Security Checking Screen
    UI->>User: Display "Security Checking..." Progress
    Auth->>HSM: Generate Device Hash
    HSM->>Auth: Return Device Hash
    Auth->>ZKP: Submit Device Fingerprint
    ZKP->>Auth: Device Verification Result
    Auth->>UI: Show Biometric Loading
    UI->>User: Display "Biometric Authentication" Progress
    Auth->>HSM: Verify Biometric
    HSM->>Auth: Biometric Verification Result
    Auth->>ZKP: Submit Biometric Verification
    ZKP->>Auth: Biometric Verification Result

    Note over User, Blockchain: ZKP Authentication Flow
    Auth->>ZKP: Request Challenge
    ZKP->>Auth: Return Challenge
    Auth->>HSM: Generate ZKP Proof
    HSM->>Auth: Return Proof
    Auth->>ZKP: Submit Proof
    ZKP->>ZKP: Verify Proof
    ZKP-->>Auth: Verification Result
    Auth->>Storage: Store Session
    Auth-->>UI: Authentication Success

    Note over User, Blockchain: Transaction Security Flow
    User->>UI: Initiate Transaction
    UI->>Auth: Request Transaction Signing
    Auth->>HSM: Sign Transaction
    HSM->>Auth: Return Signed Transaction
    Auth->>Blockchain: Submit Transaction
    Blockchain-->>Auth: Transaction Hash
    Auth-->>UI: Transaction Confirmation
    UI->>User: Show Transaction Status
```

## 📊 Component Diagram

```mermaid
graph TB
    subgraph "Frontend Components"
        A[Welcome Component]
        B[Registration Component]
        C[Restore Component]
        D[Seed Phrase Component]
        E[Security Check Component]
        F[Device Fingerprinting Component]
        G[Biometric Loading Component]
        H[Biometric Failed Component]
        I[ZKP Loading Component]
        J[Authentication Component]
        K[Main Dashboard Component]
        L[Settings Component]
        M[Transaction Component]
    end
    
    subgraph "Service Layer"
        N[Auth Service]
        O[ZKP Service]
        P[Storage Service]
        Q[Crypto Service]
        R[Blockchain Service]
        S[HSM Service]
    end
    
    subgraph "Security Layer"
        T[Certificate Pinning]
        U[Request Signing]
        V[Rate Limiting]
        W[Audit Logging]
        X[Device Fingerprinting]
        Y[Biometric Authentication]
    end
    
    subgraph "External Services"
        Z[ZKP Auth Service]
        AA[Blockchain Network]
        BB[Storage API]
        CC[Hardware Security Module]
    end
    
    A --> N
    B --> N
    C --> N
    D --> P
    E --> S
    F --> S
    G --> S
    H --> S
    I --> O
    J --> O
    K --> R
    L --> S
    M --> R
    
    N --> Q
    O --> Q
    P --> Q
    S --> Q
    
    N --> T
    N --> U
    N --> V
    N --> W
    N --> X
    N --> Y
    
    O --> Z
    R --> AA
    P --> BB
    S --> CC
```

## 🔄 State Transition Diagram

```mermaid
stateDiagram-v2
    [*] --> Uninitialized
    
    Uninitialized --> Welcome: Extension Loaded
    Welcome --> Registration: Create Account
    Welcome --> Restore: Restore Account
    Welcome --> Dashboard: Returning User
    
    Registration --> CollectingData: Start Registration
    CollectingData --> ValidatingData: Submit Data
    ValidatingData --> SeedPhraseDisplay: Valid Data
    ValidatingData --> RegistrationError: Invalid Data
    RegistrationError --> CollectingData: Retry
    
    Restore --> CollectingSeedPhrase: Start Restoration
    CollectingSeedPhrase --> ValidatingSeedPhrase: Submit Seed Phrase
    ValidatingSeedPhrase --> SeedPhraseValid: Valid Seed Phrase
    ValidatingSeedPhrase --> SeedPhraseError: Invalid Seed Phrase
    SeedPhraseError --> CollectingSeedPhrase: Retry
    
    SeedPhraseDisplay --> SeedPhraseAcknowledged: User Confirms
    SeedPhraseValid --> SecurityCheck: Start Security Check
    
    SecurityCheck --> DeviceFingerprinting: Show Security Checking
    DeviceFingerprinting --> CollectingDeviceData: User Grants Permission
    CollectingDeviceData --> VerifyingDevice: Submit Device Fingerprint
    VerifyingDevice --> DeviceValid: Valid Device
    VerifyingDevice --> DeviceError: Invalid Device
    DeviceError --> DeviceFingerprinting: Retry
    
    DeviceValid --> BiometricLoading: Show Biometric Loading
    BiometricLoading --> BiometricVerification: Show Biometric Auth
    BiometricVerification --> CollectingBiometric: User Authenticates
    CollectingBiometric --> VerifyingBiometric: Submit Biometric
    VerifyingBiometric --> BiometricValid: Valid Biometric
    VerifyingBiometric --> BiometricFailed: Invalid Biometric
    BiometricFailed --> BiometricVerification: Retry
    
    BiometricValid --> ZKPLoading: Start ZKP Auth
    ZKPLoading --> ZKPChallenge: Request Challenge
    ZKPChallenge --> GeneratingProof: Generate Proof
    GeneratingProof --> VerifyingProof: Submit Proof
    VerifyingProof --> ZKPSuccess: Valid Proof
    VerifyingProof --> ZKPError: Invalid Proof
    ZKPError --> ZKPLoading: Retry
    
    ZKPSuccess --> Dashboard: Show Dashboard
    Dashboard --> Settings: Access Settings
    Settings --> SecurityManagement: Configure Security
    SecurityManagement --> Dashboard: Return to Dashboard
    Dashboard --> TransactionFlow: User Action
    TransactionFlow --> Dashboard: Transaction Complete
    
    Dashboard --> Logout: User Logout
    Logout --> Welcome: Clear Session
```

## 📋 Entity Relationship Diagram

```mermaid
erDiagram
    USER {
        string user_id PK
        string email
        string username
        string did
        string public_key
        datetime created_at
        datetime last_login
        boolean is_active
        string hsm_status
        string biometric_status
        string device_fingerprint_status
    }
    
    SESSION {
        string session_id PK
        string user_id FK
        string token
        datetime created_at
        datetime expires_at
        boolean is_valid
        string hsm_session_id
    }
    
    SEED_PHRASE {
        string user_id PK
        string encrypted_seed_phrase
        string salt
        datetime created_at
        boolean is_backed_up
        string hsm_key_id
    }
    
    DEVICE_FINGERPRINT {
        string user_id PK
        string device_hash
        string device_characteristics
        datetime created_at
        boolean is_valid
        string hsm_verification_status
    }
    
    BIOMETRIC_DATA {
        string user_id PK
        string biometric_type
        string biometric_status
        datetime created_at
        boolean is_enabled
        string hsm_verification_status
    }
    
    TRANSACTION {
        string transaction_id PK
        string user_id FK
        string from_address
        string to_address
        decimal amount
        string currency
        string status
        datetime created_at
        string blockchain_hash
        string hsm_signature
    }
    
    HSM_STATUS {
        string user_id PK
        string hsm_type
        string compliance_level
        string status
        datetime last_verified
        boolean is_active
    }
    
    USER ||--o{ SESSION : "has"
    USER ||--|| SEED_PHRASE : "owns"
    USER ||--|| DEVICE_FINGERPRINT : "verifies"
    USER ||--|| BIOMETRIC_DATA : "authenticates"
    USER ||--o{ TRANSACTION : "performs"
    USER ||--|| HSM_STATUS : "monitors"
```

## 🔧 Deployment Diagram

```mermaid
graph TB
    subgraph "Browser Extension"
        A[Popup UI]
        B[Background Script]
        C[Content Script]
        D[Storage API]
    end
    
    subgraph "Client Security"
        E[Browser Crypto API]
        F[Certificate Pinning]
        G[Request Signing]
        H[Hardware Security Module]
        I[Device Fingerprinting]
        J[Biometric Authentication]
    end
    
    subgraph "External Services"
        K[ZKP Auth Service]
        L[Blockchain Network]
        M[Storage Service]
        N[HSM Service]
    end
    
    subgraph "Infrastructure"
        O[Load Balancer]
        P[API Gateway]
        Q[Authentication Service]
        R[Blockchain Nodes]
        S[HSM Infrastructure]
    end
    
    A --> B
    B --> C
    B --> D
    B --> E
    B --> F
    B --> G
    B --> H
    B --> I
    B --> J
    
    B --> K
    B --> L
    B --> M
    B --> N
    
    K --> O
    L --> P
    M --> Q
    N --> S
    
    O --> Q
    P --> R
```

These UML diagrams provide a comprehensive view of the MirrorStack Wallet system architecture, covering all aspects from user interactions to security implementations and deployment considerations, now including the enhanced HSM integration, biometric authentication, device fingerprinting, and comprehensive security management features. 
These UML diagrams provide a comprehensive view of the MirrorStack Wallet system architecture, covering all aspects from user interactions to security implementations and deployment considerations. 
These UML diagrams provide a comprehensive view of the MirrorStack Wallet system architecture, covering all aspects from user interactions to security implementations and deployment considerations. 