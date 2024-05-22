#!/bin/bash

cd frontend

cd src
cp App.jsx App.jsx.orig.`date -I`
sed 's,startsWith("/,startsWith("SUBPATH/,g' -i App.jsx
sed 's,path="/,path="SUBPATH/,g' -i App.jsx
sed 's,location = "/,location = "SUBPATH/,g' -i App.jsx
sed 's,window.location.origin;,"SUBPATH";,' -i App.jsx

cd views
for d in $(ls *.jsx); do cp $d $d.orig.`date -I`; done
sed 's,pathname = "/,pathname = "SUBPATH/,g' -i *.jsx
sed 's,navigate("/,navigate("SUBPATH/,g' -i *.jsx
sed 's,navigate(`/,navigate(`SUBPATH/,g' -i *.jsx
sed 's,href="/,href="SUBPATH/,g' -i *.jsx
sed 's,path = "/,path = "SUBPATH/,g' -i *.jsx
sed 's,link={"/,link={"SUBPATH/,g' -i *.jsx
sed 's,to="/,to="SUBPATH/,g' -i *.jsx
sed 's,to={"/,to={"SUBPATH/,g' -i *.jsx
sed 's,${window.location.origin},SUBPATH,g' -i *.jsx
cd ..

cd components
for d in $(ls *.jsx); do cp $d $d.orig.`date -I`; done
sed 's,to="/,to="SUBPATH/,g' -i *.jsx
sed 's,${window.location.origin},SUBPATH,g' -i *.jsx
cd ../..

cd confd/templates
cp nginx.conf nginx.conf.orig.`date -I`
sed 's,location / {,rewrite ^SUBPATH(/api/v1.*)$ $1 last;\n\n\t\tlocation / {,' -i nginx.conf
cd ../..

docker build -t ghcr.io/shuffle/shuffle-frontend:latest .


cat << EOF

If you want to reverse proxy shuffle using subpath "SUBPATH" you need to configure
your web server - in this case nginx - to do the reverse proxying by at least adding 

  location SUBPATH {
    proxy_pass http://snooss-proxy:3421/;
    rewrite SUBPATH/(.*)$ /$1 break;

    proxy_read_timeout 300s;
    
    # proxy header
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

    # substitute html content response
    proxy_set_header Accept-Encoding "";        # no compression allowed or sub_filter won't work
    sub_filter 'href="/' 'href="SUBPATH/';
    sub_filter 'href:"/' 'href:"SUBPATH/';
    sub_filter '/static' 'SUBPATH/static';
    sub_filter '/images' 'SUBPATH/images';
    sub_filter_types *;
    sub_filter_once off;
  }

to your nginx configuration.
EOF


exit 0#!/bin/bash

cd frontend

cd src
cp App.jsx App.jsx.orig.`date -I`
sed 's,startsWith("/,startsWith("SUBPATH/,g' -i App.jsx
sed 's,path="/,path="SUBPATH/,g' -i App.jsx
sed 's,location = "/,location = "SUBPATH/,g' -i App.jsx
sed 's,window.location.origin;,"SUBPATH";,' -i App.jsx

cd views
for d in $(ls *.jsx); do cp $d $d.orig.`date -I`; done
sed 's,pathname = "/,pathname = "SUBPATH/,g' -i *.jsx
sed 's,navigate("/,navigate("SUBPATH/,g' -i *.jsx
sed 's,navigate(`/,navigate(`SUBPATH/,g' -i *.jsx
sed 's,href="/,href="SUBPATH/,g' -i *.jsx
sed 's,path = "/,path = "SUBPATH/,g' -i *.jsx
sed 's,link={"/,link={"SUBPATH/,g' -i *.jsx
sed 's,to="/,to="SUBPATH/,g' -i *.jsx
sed 's,to={"/,to={"SUBPATH/,g' -i *.jsx
sed 's,${window.location.origin},SUBPATH,g' -i *.jsx
cd ..

cd components
for d in $(ls *.jsx); do cp $d $d.orig.`date -I`; done
sed 's,to="/,to="SUBPATH/,g' -i *.jsx
sed 's,${window.location.origin},SUBPATH,g' -i *.jsx
cd ../..

cd confd/templates
cp nginx.conf nginx.conf.orig.`date -I`
sed 's,location / {,rewrite ^SUBPATH(/api/v1.*)$ $1 last;\n\n\t\tlocation / {,' -i nginx.conf
cd ../..

docker build -t ghcr.io/shuffle/shuffle-frontend:latest .


cat << EOF

If you want to reverse proxy shuffle using subpath "SUBPATH" you need to configure
your web server - in this case nginx - to do the reverse proxying by at least adding 

  location SUBPATH {
    proxy_pass http://snooss-proxy:3421/;
    rewrite SUBPATH/(.*)$ /$1 break;

    proxy_read_timeout 300s;
    
    # proxy header
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

    # substitute html content response
    proxy_set_header Accept-Encoding "";        # no compression allowed or sub_filter won't work
    sub_filter 'href="/' 'href="SUBPATH/';
    sub_filter 'href:"/' 'href:"SUBPATH/';
    sub_filter '/static' 'SUBPATH/static';
    sub_filter '/images' 'SUBPATH/images';
    sub_filter_types *;
    sub_filter_once off;
  }

to your nginx configuration.
EOF


exit 0
