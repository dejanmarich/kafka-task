import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as route53 from '@aws-cdk/aws-route53';
import * as iam from '@aws-cdk/aws-iam';
import { SSL_OP_MICROSOFT_SESS_ID_BUG } from 'constants';
import { Instance, Port, SecurityGroup } from '@aws-cdk/aws-ec2';
import * as sqs from '@aws-cdk/aws-sqs';
import * as servicediscovery from '@aws-cdk/aws-servicediscovery';
import { CfnOutput, Construct, StackProps, stringToCloudFormation } from '@aws-cdk/core';
import { domain } from 'process';
import * as fs from 'fs'
import { TargetGroupBase } from '@aws-cdk/aws-elasticloadbalancingv2';
import { HttpNlbIntegration } from '@aws-cdk/aws-apigatewayv2-integrations';
import { ManagedPolicy, Policy, User } from '@aws-cdk/aws-iam';
import { RoleStack } from '../lib/roles-stack'

export class MicroStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const role = iam.Role.fromRoleArn( this, 'microRole','arn:aws:iam::${cdk.Stack.of(this).account}:role/microRole', 
        { mutable: false }
    );
    
    // define Ubuntu Image (how to find AMI image - https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/finding-an-ami.html)
    const machineImage = ec2.MachineImage.fromSsmParameter(
    '/aws/service/canonical/ubuntu/server/focal/stable/current/amd64/hvm/ebs-gp2/ami-id'
    ) 
    // define VPC to default unless we need to create new
    const defaultVpc = ec2.Vpc.fromLookup(this, 'VPC', {
        isDefault: true
      })

    const microSecurityGroup = new ec2.SecurityGroup(this, 'microSecurityGroup',
    {
      vpc: defaultVpc,
      allowAllOutbound: true,
      description: 'microservice security group'
    })
    microSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22))
    microSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(9092))
    microSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(8081))


    const microService = new ec2.Instance(this, 'microservice', {
      instanceType: new ec2.InstanceType('t3.micro'),
      machineImage: machineImage,
      instanceName: 'microservice',
      vpc: defaultVpc,
      keyName: 'microservice',
      role: role,
      securityGroup: microSecurityGroup
    })  

    const zone = route53.PrivateHostedZone.fromLookup(this, 'HostedZone', {
      domainName: "test.com.",
      privateZone: true 
    })

    new route53.ARecord(this, 'AnameRecord6', {
      zone: zone,
      recordName: 'microservice',
      target: route53.RecordTarget.fromIpAddresses(microService.instancePrivateIp),
      ttl: cdk.Duration.minutes(1),   
    });


    new cdk.CfnOutput(this, 'IP Address', { value: microService.instancePublicIp });
    new cdk.CfnOutput(this, 'Download Key Command', { value: 'aws secretsmanager get-secret-value --secret-id ec2-ssh-key/cdk-keypair/private --query SecretString --output text > cdk-key.pem && chmod 400 cdk-key.pem' })
    new cdk.CfnOutput(this, 'ssh command', { value: 'ssh -i my-key.pem -o IdentitiesOnly=yes ec2-user@' + microService.instancePublicIp })
    

  }
}