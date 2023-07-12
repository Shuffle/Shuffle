## Install Shuffle on AWS

First, you need to create your own VPC for the same range of private IP addresses.

**To create a VPC in AWS, follow these steps**

1. Sign in to the AWS Management Console and open the Amazon VPC console at https://console.aws.amazon.com/vpc/.
2. In the top navigation bar, choose the region in which you want to create the VPC.
3. In the navigation pane, choose Your VPCs & Choose Create VPC.
4. Enter a name for your VPC in the Name tag field & Choose VPC and more option. 
5. Specify the IPv4 CIDR block for your VPC. The CIDR block is the range of IP addresses that will be available for use within your VPC. You can specify any CIDR block that is:
  - Between a /16 and /28 netmask (inclusive)
  - Not currently in use
6. Specify the AZs, Number of public subnets & Number of private subnets.

![image](https://user-images.githubusercontent.com/118437260/211500830-30c52dc0-0688-47f9-8ee7-eb7f9b31a9b8.png)

7. Choose Yes, Create VPC.

Your VPC will be created and will appear in the list of Your VPCs. By default, a VPC includes a default security group and a default network ACL. You can customize your VPC by adding subnets, security groups, network ACLs, and other resources.



**To create an EC2 instance in AWS, follow these steps:**

1. Sign in to the AWS Management Console and open the Amazon EC2 console at https://console.aws.amazon.com/ec2/.
2. In the top navigation bar, choose the region in which you want to create the instance.
3. In the navigation pane, choose Instances and Choose Launch Instance.
4. On the Choose an Amazon Machine Image (AMI) page, choose an AMI. An AMI is a template that contains the software configuration (operating system, application     server, and applications) for your instance.
5. On the Choose an Instance Type page, choose the hardware configuration of your instance. 
6. On the Select an existing key pair or create a new key pair dialog box, choose an existing key pair or create a new one.
7. On the network settings page and click on edit and select your VPC & subnet.
8. On the Configure Security Group page, configure the security group for your instance. A security group acts as a virtual firewall for your instance to control inbound and outbound traffic.

![image](https://user-images.githubusercontent.com/118437260/211514598-1c95e459-b98a-4579-b3a7-a92bf36e9f50.png)

9. On the Add Storage page, add storage to your instance.
10. Review your instance launch details and choose Launch.
