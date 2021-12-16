import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as iam from '@aws-cdk/aws-iam';
import * as route53 from '@aws-cdk/aws-route53';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import * as elasticloadbalancingv2_targets from '@aws-cdk/aws-elasticloadbalancingv2-targets';
import { RecordTarget, RecordType } from '@aws-cdk/aws-route53';
import { TargetGroupBase } from '@aws-cdk/aws-elasticloadbalancingv2';
import * as route53targets from "@aws-cdk/aws-route53-targets";
import { AliasTargetInstance } from '@aws-cdk/aws-servicediscovery';

export class SchemaStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
      super(scope, id, props);

     // define Ubuntu Image (how to find AMI image - https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/finding-an-ami.html)
     const machineImage = ec2.MachineImage.fromSsmParameter(
        '/aws/service/canonical/ubuntu/server/focal/stable/current/amd64/hvm/ebs-gp2/ami-id'
        ) 
        // define VPC to default unless we need to create new
    const defaultVpc = ec2.Vpc.fromLookup(this, 'VPC', {
        isDefault: true
          })
    
    const role = iam.Role.fromRoleArn( this, 'ec2Role', 'arn:aws:iam::${cdk.Stack.of(this).account}:role/ec2Role', 
          { mutable: false
        }
      );

    // define Security group for Schema Registry EC2 instances
    const schemaSecurityGroup = new ec2.SecurityGroup(this, 'schemaSecurityGroup',
    {
      vpc: defaultVpc,
      allowAllOutbound: true,
      description: 'schema registry security group',
    })
    schemaSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(8081)) 
    schemaSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22))

/*     // Create Schema Registry EC2 instances
    for (var i = 1; i<=2; i++) {
        new ec2.Instance(this, 'schema' + i, {
        instanceType: new ec2.InstanceType('t2.micro'), 
        machineImage: machineImage,
        instanceName: 'schema' + i,
        vpc: defaultVpc,
        securityGroup: schemaSecurityGroup,
        keyName: 'ubuntu',
        role: role },
    )}  */

    const instance1 = new ec2.Instance(this, 'schema1', {
        instanceType: new ec2.InstanceType('t2.micro'), 
        machineImage: machineImage,
        instanceName: 'schema1',
        vpc: defaultVpc,
        securityGroup: schemaSecurityGroup,
        keyName: 'ubuntu',
        role: role }
    )

    const instance2 = new ec2.Instance(this, 'schema2', {
        instanceType: new ec2.InstanceType('t2.micro'), 
        machineImage: machineImage,
        instanceName: 'schema2',
        vpc: defaultVpc,
        securityGroup: schemaSecurityGroup,
        keyName: 'ubuntu',
        role: role }
    )

    // Network Load balancer for Schema Registry
    const lb = new elbv2.NetworkLoadBalancer(this, 'LB', {
        vpc: defaultVpc,
        internetFacing: false,
        loadBalancerName: 'SchemaLB'
    })
    const listener = lb.addListener('listener', { port: 8081 })
    listener.addTargets('target', {
        targets: [
            new elasticloadbalancingv2_targets.InstanceIdTarget(instance1.instanceId),
            new elasticloadbalancingv2_targets.InstanceIdTarget(instance2.instanceId)
        ],
        port: 8081
    })

    new cdk.CfnOutput(this, 'IP Address for SchemaReg LB:', { value: lb.loadBalancerDnsName });

    const zone = route53.PrivateHostedZone.fromLookup(this, 'HostedZone', {
        domainName: "test.com.",
        privateZone: true 
      })

    new route53.ARecord(this, 'AnameRecord1', {
        zone: zone,
        recordName: 'schema1',
        target: route53.RecordTarget.fromIpAddresses(instance1.instancePrivateIp),
        ttl: cdk.Duration.minutes(1),   
    });

    new route53.ARecord(this, 'AnameRecord2', {
        zone: zone,
        recordName: 'schema2',
        target: route53.RecordTarget.fromIpAddresses(instance2.instancePrivateIp),
        ttl: cdk.Duration.minutes(1),   
    });

  }
}

