# Deployment Guide

## Docker
The platform can be deployed using `docker-compose`. Ensure all `.env` variables are correctly set.

## AWS
Use the provided CloudFormation templates in `deployment/aws`.
1. Run `./deploy.sh`
2. Monitor stack creation in AWS Console
3. Update DNS records to point to the ALB
