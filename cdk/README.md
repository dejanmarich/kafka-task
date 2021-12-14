## Deployment of AWS components (EC2, IAM, ROUTE53, NLB)

### Prerequisites: </br>
*AWS Account* </br>
*Node.js >=10.13* </br>
*aws-cdk toolkit* (https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html)

IAC is divided into the following stacks:

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

</br>
## Deployment order:
1. Deploy `IAMStack` to create IAM Roles, Policies and attach them to Users
2. Deploy `DnsStack` to assign `PVC` and create `PrivateHostedZone`
3. Deploy `KafkaStack` to create 3 EC2 instances for `Zookeeper` and `Kafka` with private `ARecords` and `NLB`. The output should look like this:
```
 ✅  kafkaStack

Outputs:
kafkaStack.IPAddressforKafkaLB = KafkaLB-02dacce20d4dc712.elb.us-east-1.amazonaws.com
```
4. Deploy `SchemaStack` to create 2 EC2 instances for `Schema Registry` with private `ARecords` and `NLB`. The output should look like this:
```
 ✅  SchemaRegistry

Outputs:
SchemaRegistry.IPAddressforSchemaRegLB = SchemaLB-0f973b7c3a309242.elb.us-east-1.amazonaws.com
```
5. Deploy `AnsibleController` to create EC2 instance where `Ansible` will be installed
6. Deploy `MicroserviceStack` to create EC2 instance which will connect to `Kafka` and/or `Schema Registry`. The output should look like this:
```
 ✅  MicroserviceStack

Outputs:
MicroserviceStack.DownloadKeyCommand = aws secretsmanager get-secret-value --secret-id ec2-ssh-key/cdk-keypair/private --query SecretString --output text > microservice.pem && chmod 400 microservice.pem
MicroserviceStack.IPAddress = 34.229.81.141
MicroserviceStack.sshcommand = ssh -i microservice.pem -o IdentitiesOnly=yes ubuntu@34.229.81.141
```

You can now connect to the Microservice EC2 instance with provided credentials.

## Tests

* Test DNS resolving
```
ubuntu@ip-172-31-81-79: nslookup kafka1.test.com
Server:		127.0.0.53
Address:	127.0.0.53#53

Non-authoritative answer:
Name:	kafka1.test.com
Address: 172.31.20.113
```

* Test LoadBalancer 
```
ubuntu@p-172-31-31-185:~$ kafkacat -b KafkaLB-02dacce20d4dc712.elb.us-east-1.amazonaws.com -t test1
% Auto-selecting Consumer mode (use -P or -C to override)
Dec 14 21:08:01 ip-172-31-31-185 systemd[1]: Started PackageKit Daemon.
Dec 14 21:10:20 ip-172-31-31-185 systemd[1]: Starting Ubuntu Advantage Timer for running repeated jobs...
Dec 14 21:10:20 ip-172-31-31-185 systemd[1]: ua-timer.service: Succeeded.
Dec 14 21:10:20 ip-172-31-31-185 systemd[1]: Finished Ubuntu Advantage Timer for running repeated jobs.
Dec 14 21:14:10 ip-172-31-31-185 systemd[1]: proc-sys-fs-binfmt_misc.automount: Got automount request for /proc/sys/fs/binfmt_misc, triggered by 13971 (find)
Dec 14 21:14:10 ip-172-31-31-185 systemd[1]: Mounting Arbitrary Executable File Formats File System...
Dec 14 21:14:10 ip-172-31-31-185 systemd[1]: Mounted Arbitrary Executable File Formats File System.
Dec 14 21:17:01 ip-172-31-31-185 CRON[14036]: (root) CMD (   cd / && run-parts --report /etc/cron.hourly)
Dec 14 21:18:12 ip-172-31-31-185 PackageKit: daemon quit
Dec 14 21:18:12 ip-172-31-31-185 systemd[1]: packagekit.service: Succeeded.
% Reached end of topic test1 [0] at offset 10
```

* Test private DNS 
```
ubuntu@ip-172-31-31-185:/$ kafkacat -b kafka1.test.com -t test1
% Auto-selecting Consumer mode (use -P or -C to override)
Dec 14 21:08:01 ip-172-31-31-185 systemd[1]: Started PackageKit Daemon.
Dec 14 21:10:20 ip-172-31-31-185 systemd[1]: Starting Ubuntu Advantage Timer for running repeated jobs...
Dec 14 21:10:20 ip-172-31-31-185 systemd[1]: ua-timer.service: Succeeded.
Dec 14 21:10:20 ip-172-31-31-185 systemd[1]: Finished Ubuntu Advantage Timer for running repeated jobs.
Dec 14 21:14:10 ip-172-31-31-185 systemd[1]: proc-sys-fs-binfmt_misc.automount: Got automount request for /proc/sys/fs/binfmt_misc, triggered by 13971 (find)
Dec 14 21:14:10 ip-172-31-31-185 systemd[1]: Mounting Arbitrary Executable File Formats File System...
Dec 14 21:14:10 ip-172-31-31-185 systemd[1]: Mounted Arbitrary Executable File Formats File System.
Dec 14 21:17:01 ip-172-31-31-185 CRON[14036]: (root) CMD (  cd / && run-parts --report /etc/cron.hourly)
Dec 14 21:18:12 ip-172-31-31-185 PackageKit: daemon quit
Dec 14 21:18:12 ip-172-31-31-185 systemd[1]: packagekit.service: Succeeded.
% Reached end of topic test1 [0] at offset 10
```
