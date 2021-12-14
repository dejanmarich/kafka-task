import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
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
import { ManagedPolicy, Policy, Role, User } from '@aws-cdk/aws-iam';

export class AnsibleStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // define VPC to default unless we need to create new
    const defaultVpc = ec2.Vpc.fromLookup(this, 'VPC', {
      isDefault: true
    })

    // define Ubuntu Image (how to find AMI image - https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/finding-an-ami.html)
    const machineImage = ec2.MachineImage.fromSsmParameter(
      '/aws/service/canonical/ubuntu/server/focal/stable/current/amd64/hvm/ebs-gp2/ami-id'
    )

    const role = iam.Role.fromRoleArn( this, 'microRole','arn:aws:iam::${cdk.Stack.of(this).account}:role/ec2Role', 
          { mutable: false }
      );

    // define Security group for Ansible Controller EC2 instance
    const ansibleSecurityGroup = new ec2.SecurityGroup(this, 'ansibleSecurityGroup',
    {
      vpc: defaultVpc,
      allowAllOutbound: true,
      description: 'ansible controller security group'
    })
    ansibleSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22))

    // Create Ansible Controller EC2 instance
    const ansibleController = new ec2.Instance(this, 'ansible-controller', {
      instanceType: new ec2.InstanceType('t3.micro'),
      machineImage: machineImage,
      instanceName: 'ansiblecontroller',
      vpc: defaultVpc,
      securityGroup: ansibleSecurityGroup,
      keyName: 'ubuntu',
      role: role,
      init: ec2.CloudFormationInit.fromElements(
        ec2.InitCommand.shellCommand('sudo apt-get update -y'),
        ec2.InitCommand.shellCommand('sudo apt-get install -y ansible')
      )
    })
    ansibleController.addUserData(
      fs.readFileSync('lib/install_ansible.sh', 'utf-8')
    ) 

    new cdk.CfnOutput(this, 'ansible-controller-output', {
      value: ansibleController.instancePrivateIp
    })
}
}