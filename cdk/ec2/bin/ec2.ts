#!/usr/bin/env node
import 'source-map-support/register';
import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';
import { kafkaStack } from '../lib/kafka-stack';
import { DnsStack } from '../lib/dns-stack';
import { SchemaStack } from '../lib/schema-stack';
import { MicroStack } from '../lib/microservice-stack';
import { AnsibleStack } from '../lib/ansible-stack';
import { RoleStack} from '../lib/roles-stack'
import * as ec2 from '@aws-cdk/aws-ec2'

// -- variables --
const iamrole = iam.Role

const app = new cdk.App();
new kafkaStack(app, 'KafkaStack', {
  env: {
    account: process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION
  }
})

new RoleStack(app, 'IAMStack', {
  env: {
    account: process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION
  }
})

new DnsStack(app, 'DnsStack', {
  env: {
    account: process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION
  }
})

new MicroStack(app, 'MicroserviceStack', {
  env: {
    account: process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION
  }
})

new SchemaStack(app, 'SchemaStack', {
  env: {
    account: process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION
  }
})

new AnsibleStack(app, 'AnsibleControllerStack', {
  env: {
    account: process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION
  }
})

