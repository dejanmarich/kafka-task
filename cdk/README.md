# Deployment of AWS components (EC2, IAM, ROUTE53, NLB)

Prerequisites:
**AWS Account** 
**Node.js >=10.13**
**aws-cdk toolkit** (https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html)

IAC is divided into following stacks:

```
user@local ec2 % cdk ls -n
AnsibleControllerStack
DnsStack
IAMStack
KafkaStack
MicroserviceStack
SchemaStack
```
Run `cdk deploy <StackName>` to execute Stack.


# Deployment order:
1. Deploy `IAMStack` to create IAM Roles, Policies and attach them to Users
2. Deploy `DnsStack` to assign `PVC` and create `PrivateHostedZone`
3. Deploy `KafkaStack` to create 3 EC2 instances for `Zookeeper` and `Kafka` with private `ARecords` and `NLB`. The output should look like:
```
 ✅  kafkaStack

Outputs:
kafkaStack.IPAddressforKafkaLB = KafkaLB-02dacce20d4dc712.elb.us-east-1.amazonaws.com
```
4. Deploy `SchemaStack` to create 2 EC2 instances for `Schema Registry` with private `ARecords` and `NLB`. The output should look like:
```
 ✅  SchemaRegistry

Outputs:
SchemaRegistry.IPAddressforSchemaRegLB = SchemaLB-0f973b7c3a309242.elb.us-east-1.amazonaws.com
```
5. Deploy `AnsibleController` to create EC2 instance where `Ansible` will be installed
6. Deploy `MicroserviceStack` to create EC2 instance which will connect to `Kafka` and/or `Schema Registry`. The output should look like:
```
 ✅  MicroserviceStack

Outputs:
MicroserviceStack.DownloadKeyCommand = aws secretsmanager get-secret-value --secret-id ec2-ssh-key/cdk-keypair/private --query SecretString --output text > microservice.pem && chmod 400 microservice.pem
MicroserviceStack.IPAddress = 34.229.81.141
MicroserviceStack.sshcommand = ssh -i microservice.pem -o IdentitiesOnly=yes ubuntu@34.229.81.141
```

You can now connect to Microservice EC2 instance with provided credentials.

* Test
```
ubuntu@ip-172-31-81-79: nslookup kafka1.test.com
Server:		127.0.0.53
Address:	127.0.0.53#53

Non-authoritative answer:
Name:	kafka1.test.com
Address: 172.31.20.113
```


