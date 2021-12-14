import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2'
import * as route53 from '@aws-cdk/aws-route53';
import * as iam from '@aws-cdk/aws-iam';
import { SSL_OP_MICROSOFT_SESS_ID_BUG } from 'constants';
import { Instance, Port, SecurityGroup } from '@aws-cdk/aws-ec2';
import * as sqs from '@aws-cdk/aws-sqs';
import * as servicediscovery from '@aws-cdk/aws-servicediscovery';
import { CfnOutput, Construct, stringToCloudFormation } from '@aws-cdk/core';
import { domain } from 'process';
import * as fs from 'fs'
import { TargetGroupBase } from '@aws-cdk/aws-elasticloadbalancingv2';
import { HttpNlbIntegration } from '@aws-cdk/aws-apigatewayv2-integrations';
import { ManagedPolicy, Policy, User } from '@aws-cdk/aws-iam';
import { IPrivateHostedZone } from '@aws-cdk/aws-route53';

export class DnsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props) 

    // define VPC to default unless we need to create new
    const defaultVpc = ec2.Vpc.fromLookup(this, 'VPC', {
      isDefault: true
    })

    // create Private Hosted Zone
    const zone = new route53.PrivateHostedZone(this, 'HostedZone', {
      zoneName: 'test.com',
      vpc: defaultVpc
    });

    // Create CNAME records for servers in Private Hosted Zone
/*     for (var i = 1; i<=3; i++) {
        new route53.CnameRecord(this, 'kafkaCnameRecord' + i, {
          domainName: 'test.com',
          zone: zone,
          recordName: 'kafka' + i
          }
      )} 
  
    for (var i = 1; i<=2; i++) {
    new route53.CnameRecord(this, 'schemaCnameRecord' + i, {
        domainName: 'test.com',
        zone: zone,
        recordName: 'schema' + i
        }
    )}   
 */
  }
}