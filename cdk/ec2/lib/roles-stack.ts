import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as iam from '@aws-cdk/aws-iam';
import { ManagedPolicy, Policy, User } from '@aws-cdk/aws-iam';
import { CfnKeySigningKey } from '@aws-cdk/aws-route53';


export class RoleStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // define VPC to default unless we need to create new
    const defaultVpc = ec2.Vpc.fromLookup(this, 'VPC', {
      isDefault: true
    })

    // Create IAM Policy for Confluent services
    const ec2Policy = new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            resources: ['arn:aws:ec2:us-east-1:*:*'],
            actions: ['ec2:*'],
          }),
        ],
      });

    // Create IAM Role for Confluent services
    const confluentRole = new iam.Role(this, 'ec2Role', {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('ec2.amazonaws.com'),
        new iam.AccountPrincipal(this.account)
        ),
      inlinePolicies: {
          ec2policy: ec2Policy
      },
      description: 'EC2 role for Confluent services',
      roleName: 'ec2Role'
    })
    
    const user = iam.User.fromUserArn(this, 'tesUser', 'arn:aws:iam::${cdk.Stack.of(this).account}:user/test').attachInlinePolicy


    // Create IAM Policy for accessing EC2 microservice instance
    const microPolicy = new iam.PolicyDocument({
        statements: [
            new iam.PolicyStatement ({
                resources: ['arn:aws:ec2:us-east-1:*:instance/*'],
                actions: ['ec2:*']
            })
        ]
    })

    
    // Create IAM Role for accessing EC2 microservice instance
    const microRole = new iam.Role(this, 'microRole', {
        assumedBy: new iam.CompositePrincipal(
          new iam.ServicePrincipal('ec2.amazonaws.com'),
          new iam.AccountPrincipal(this.account)
          ),
          inlinePolicies: {
              micropolicy: microPolicy
          },
        description: 'EC2 role for microservice instance',
        roleName: 'microRole'
      })
      microRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2FullAccess'))
      const micro = iam.User.fromUserArn(this, 'micro', 'arn:aws:iam::${cdk.Stack.of(this).account}:user/micro').attachInlinePolicy


  }
}