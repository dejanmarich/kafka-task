import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import * as elasticloadbalancingv2_targets from '@aws-cdk/aws-elasticloadbalancingv2-targets';
import * as route53 from '@aws-cdk/aws-route53';
import * as iam from '@aws-cdk/aws-iam';
import { Instance, Port, SecurityGroup } from '@aws-cdk/aws-ec2';
import * as sqs from '@aws-cdk/aws-sqs';
import * as servicediscovery from '@aws-cdk/aws-servicediscovery';
import { CfnOutput, Construct, stringToCloudFormation } from '@aws-cdk/core';
import { domain } from 'process';
import { HttpNlbIntegration } from '@aws-cdk/aws-apigatewayv2-integrations';
import { ManagedPolicy, Policy, User } from '@aws-cdk/aws-iam';

export class kafkaStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // define VPC to default unless we need to create new
    const defaultVpc = ec2.Vpc.fromLookup(this, 'VPC', {
      isDefault: true
    })
    
    const role = iam.Role.fromRoleArn( this, 'microRole','arn:aws:iam::${cdk.Stack.of(this).account}:role/ec2Role', 
          { mutable: false }
      );

     // define Ubuntu Image (how to find AMI image - https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/finding-an-ami.html)
    const machineImage = ec2.MachineImage.fromSsmParameter(
      '/aws/service/canonical/ubuntu/server/focal/stable/current/amd64/hvm/ebs-gp2/ami-id'
    )

    // define Security group for Broker and Zookeeper EC2 instances
    const kafkaSecurityGroup = new ec2.SecurityGroup(this, 'kafkaSecurityGroup',
    {
      vpc: defaultVpc,
      allowAllOutbound: true,
      description: 'kafka and zookeeper security group'
    })
    kafkaSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80))
    kafkaSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22))
    kafkaSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(9092))
    kafkaSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcpRange(2888, 3888))
    kafkaSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(2181))
    
    // Create EC2 instances and assing existing key. (How to create new key - https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-key-pairs.html)
    // Create Zookeeper and Broker EC2 instances
/*       for (var i = 1; i<=3; i++) {
        new ec2.Instance(this, 'kafka' + i, {
        instanceType: new ec2.InstanceType('t2.micro'), 
        machineImage: machineImage,
        vpc: defaultVpc,
        instanceName: 'kafka' + i,
        securityGroup: kafkaSecurityGroup,
        keyName: 'ubuntu',
        role: role },
    )}   */ 

    const zone = route53.PrivateHostedZone.fromLookup(this, 'HostedZone', {
      domainName: "test.com.",
      privateZone: true 
    })

    // Create Broker and Zookeeper instances
    const instance1 = new ec2.Instance(this, 'kafka1', {
      instanceType: new ec2.InstanceType('t2.micro'), 
      machineImage: machineImage,
      instanceName: 'kafka1',
      vpc: defaultVpc,
      securityGroup: kafkaSecurityGroup,
      keyName: 'ubuntu',
      role: role 
    })

    const instance2 = new ec2.Instance(this, 'kafka2', {
      instanceType: new ec2.InstanceType('t2.micro'), 
      machineImage: machineImage,
      instanceName: 'kafka2',
      vpc: defaultVpc,
      securityGroup: kafkaSecurityGroup,
      keyName: 'ubuntu',
      role: role 
    })

    const instance3 = new ec2.Instance(this, 'kafka3', {
      instanceType: new ec2.InstanceType('t2.micro'), 
      machineImage: machineImage,
      instanceName: 'kafka3',
      vpc: defaultVpc,
      securityGroup: kafkaSecurityGroup,
      keyName: 'ubuntu',
      role: role 
    })

    // Network Load balancer for Schema Registry
    const lb = new elbv2.NetworkLoadBalancer(this, 'LB', {
      vpc: defaultVpc,
      internetFacing: false,
      loadBalancerName: 'KafkaLB'
    })
    const listener = lb.addListener('listener', { port: 9092 })
    listener.addTargets('target', {
      targets: [
          new elasticloadbalancingv2_targets.InstanceIdTarget(instance1.instanceId),
          new elasticloadbalancingv2_targets.InstanceIdTarget(instance2.instanceId),
          new elasticloadbalancingv2_targets.InstanceIdTarget(instance3.instanceId)
      ],
      port: 9092
  })   
    new cdk.CfnOutput(this, 'IP Address for Kafka LB:', { value: lb.loadBalancerDnsName });

    new route53.ARecord(this, 'AnameRecord3', {
      zone: zone,
      recordName: 'kafka1',
      target: route53.RecordTarget.fromIpAddresses(instance1.instancePrivateIp),
      ttl: cdk.Duration.minutes(1),   
    });

    new route53.ARecord(this, 'AnameRecord4', {
      zone: zone,
      recordName: 'kafka2',
      target: route53.RecordTarget.fromIpAddresses(instance2.instancePrivateIp),
      ttl: cdk.Duration.minutes(1),   
    });

    new route53.ARecord(this, 'AnameRecord5', {
      zone: zone,
      recordName: 'kafka3',
      target: route53.RecordTarget.fromIpAddresses(instance3.instancePrivateIp),
      ttl: cdk.Duration.minutes(1),   
    });

  }
}