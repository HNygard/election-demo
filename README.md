# Online Election Demo

This is a demonstration application that showcases potential vulnerabilities and security challenges in web-based voting systems. The purpose of this project is educational, aiming to highlight why online voting in democratic elections requires careful consideration.

## Purpose

This demo illustrates common security concerns and technical challenges that make online voting problematic for democratic elections. It serves as a practical example of why many cybersecurity experts are cautious about implementing internet voting for official elections.

This application is connected to my talk on election security. I don't think it makes sense all by itself without the associated "flair" on stage.

## 🚨 Important Notice

This is a demonstration tool only. It should NOT be used for actual elections or voting purposes. The vulnerabilities shown are intentional for educational purposes.

## (TODO) Security Concerns Demonstrated

- Potential for vote manipulation
    - I will manipulate the published result.
- Issues with voter anonymity
    - I will show snippet of the logs with details like IP,
      browser, etc
- Exclusion of some groups
    - Example: Exclude based on network (Telenor mobil or other large carrier in Norway)
    - Example: Exclude based on brower (Ios devices get error)

Might be cut for time:
- Vote verification
    - Give a verification code at the end. Can supposablity
    use it to verify that your vote was part of the result.
    - Can you trust the verification?
    - Who can verify the veriication? A handful of people? Is that good for trust in the election?

- Voter authentication challenges

## Educational Value

This project helps:
- Election officials understand technical risks
- Developers learn about security challenges
- Students explore cybersecurity concepts
- Demonstrate why traditional voting methods remain important

## Technical Implementation

### Backend

The backend is built with Express.js and includes several intentionally transparent features that highlight security concerns:

- In-memory vote storage (votes can be lost on server restart)
- Voter tracking system that collects:
  - IP addresses
  - Browser information
  - Language preferences
  - Geographic location (via GeoIP)
  - Timestamps
- No authentication required for voting
- Public API endpoints for:
  - Submitting votes
  - Viewing election results
  - Accessing voter information
  - Resetting all data
- Rate limiting (5 requests per 15 minutes per IP)
- Simple verification codes with no cryptographic security

## Disclaimer

This application intentionally contains vulnerabilities for educational purposes. Do not use any code from this project in production systems or real election applications.

## Development
See .clinerules

## Deployment

To set up the deployment environment variables and secrets for GitHub Actions, follow these steps:

1. Go to your GitHub repository and click on `Settings`.
2. In the left sidebar, click on `Secrets` and then `Actions`.
3. Click on the `New repository secret` button to add the following secrets:
   - `SSH_HOST`: The hostname or IP address of your server.
   - `SSH_USER`: The SSH username to connect to your server.
   - `SSH_KEY`: The private SSH key to authenticate with your server.
   - `SSH_PORT`: The SSH port (default is 22, but change if your server uses a different port).

Once these secrets are set up, the GitHub Actions workflow will use them to deploy the application to your server.

### Server

Setup a compute node in GCP/Azure/AWS with SSH.

```
sudo apt install git docker docker-compose

sudo usermod -aG docker $USER
newgrp docker

sudo git clone https://github.com/HNygard/election-demo.git /opt/election-demo
sudo chown -R $(id -u):$(id -g) /opt/election-demo/
cd /opt/election-demo/
docker-compose up
```

Connect to Cloudflare for domain handling.
