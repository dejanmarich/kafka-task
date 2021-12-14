# Ansible Playbook for Confluent Community platform

Prerequisites: 
**Ubuntu Server**  - Tested on version 20.04.X  
**Ansible 2.9.X** - Tested on version 2.9.6  
**Network** - Allowed communication between target machines on ports 2181, 9092, 2888, 3888, 8080, 9999
**Java** - Tested on openjdk-8 (1.8.0_292)


# Prepare repos

Clone the repo from github to your destination on the Ansible controller machine. This setup was designed to make deployment of various Confluent components on multiple environments and servers (test, dev, production, etc.). Playbooks are separated for each service, in case you want to run `Zookeeper` on 3 nodes, and `Kafka` on 4 nodes or similar.

Example for deploying *Zookeeper* and *Kafka* on 3 node cluster in *test* environment.  
List of playbooks:
**confluent_core.yml** - get confluent packages with necessary binary files /opt/confluent-{version}/<br/>
**confluent_zookeeper.yml** - deploy Zookeeper <br/>
**confluent_kafka.yml** - deploy Kafka<br/>
**confluent_destroy.yml** - if something goes wrong, run it to delete everything so you can start from the scratch (except for package download)
1. Create hosts file or change existing file. (e.g. hosts.test):
```
# CONFLUENT-CORE
[confluent_core]
confluent-1 ansible_host=kafka1.test.com # Your IP or DN
confluent-2 ansible_host=kafka2.test.com # Your IP or DN
confluent-3 ansible_host=kafka3.test.com # Your IP or DN

# CONFLUENT-ZOOKEEPER
[confluent_zookeeper]
zookeeper-1 ansible_host=kafka1.test.com # Your IP or DN
zookeeper-2 ansible_host=kafka2.test.com # Your IP or DN
zookeeper-3 ansible_host=kafka3.test.com # Your IP or DN

# CONFLUENT-KAFKA
[confluent_kafka]
kafkabroker-1 ansible_host=kafka1.test.com # Your IP or DN
kafkabroker-2 ansible_host=kafka2.test.com # Your IP or DN
kafkabroker-3 ansible_host=kafka3.test.com # Your IP or DN
```

# Setup Group vars
Open `group_vars -> confluent_{service} -> vars` and edit environment servers
````
#DYNAMIC PART OF CONFIGURATION (per Environment)
#ENV
    test:
      server1: 'kafka1.test.com' # CHANGE TO IP OF SERVER 1
      server2: 'kafka2.test.com' # CHANGE TO IP OF SERVER 2 
      server3: 'kafka3.test.com' # CHANGE TO IP OF SERVER 3
      log_dir: '/var/log/zookeeper'
      user: 'zookeeper' 
      group: 'confluent'
      ...
````

After changes were made, we can run playbooks. Each playook has `extra vars` parameters for `confluentTarget` (targets are Kafka, Zookeeper, and Schema Registry), and `appEnv` (environments are dev, test and prod).

# Deploy confluent_core playbook
This will get the confluent community package from the internet, unzip and delete zip file on target machines. It will also setup users, install openjdk8, and all other neccessary prerequisits for Confluent services. 

`ansible-playbook playbooks/confluent_core.yml -i hosts.test --private-key="mykey.pem" --extra-vars="confluentTarget=confluent_core appEnv=test" -v --diff`

# Deploy confluent_zookeeper playbook
This will setup Zookeeper on targeted instances

`ansible-playbook playbooks/confluent_zookeeper.yml -i hosts.test --private-key="mykey.pem" --extra-vars="confluentTarget=confluent_zookeeper appEnv=test" -v --diff` 

# Deploy confluent_kafka playbook
This will setup Kafka on targeted instances

`ansible-playbook playbooks/confluent_kafka.yml -i hosts.test --private-key="mykey.pem" --extra-vars="confluentTarget=confluent_kafka appEnv=test" -v --diff`

# Deploy confluent_schemaregistry playbook
This will setup Schema Registry on targeted instances

`ansible-playbook playbooks/confluent_schemaregistry.yml -i hosts.test --private-key="mykey.pem" --extra-vars="confluentTarget=confluent_schemaregistry appEnv=test" -v --diff`


# Troubleshooting
* If you don't have correct sudo access to the remote target instances, in playbook add command `--ask-become-pass` and after executing playbook, enter sudo password for user "ubuntu".
* If you don't have ssh key, you will need to create ssh user and authorized key by calling `enable_access.yml` playbook:
`ansible-playbook playbooks/enable_access.yml -i hosts.test --private-key="mykey.pem" --extra-vars="confluentTarget=all appEnv=test" -v --diff`




