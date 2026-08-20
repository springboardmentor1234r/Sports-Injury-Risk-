#!/bin/bash
echo "Deploying to AWS..."
aws cloudformation deploy --template-file cloudformation.yml --stack-name sport-injury-platform
