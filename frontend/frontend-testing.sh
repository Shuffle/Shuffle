
SERVER_URL="http://localhost:3000"

declare -a Routes=()

# Add all cloud routes here
if [[ "$SERVER_URL" == "http://localhost:3001" || "$SERVER_URL" == "http://localhost:3002" || "$SERVER_URL" == "https://sandbox.shuffler.io" || "$SERVER_URL" == "https://shuffler.io" ]]; then
Routes+=(
'homepage'
'home'
'contact'
'workflows/fa9314a7-bb9b-4b41-8885-1d02b199f04d'
'services'
'debug'
'creator'
'articles'
'partners'
'pricing'
'pricing2'
'training'
'professional-services'
'detections'
)
fi

# Add all common routes here
Routes+=(
'workflows'
'workflows?tab=org_workflows'
'workflows?tab=my_workflows'
'workflows?tab=all_workflows'
'usecases'
'usecases2'
'getting-started'
'welcome'
'health'
'docs'
'settings'
'apps/new'
'apps/gmail'
'apis/gmail'
'forms'
'apps'
'apps?tab=my_apps'
'apps?tab=all_apps'
'search'
'search?tab=org_apps'
'search?tab=my_apps'
'search?tab=workflows'
'search?tab=docs'
'search?tab=creators'
'search?tab=discord'
"admin?tab=organization"
"admin?tab=users"
"admin?tab=app_auth"
"admin?tab=datastore"
"admin?tab=files"
"admin?tab=triggers"
"admin?tab=locations"
"admin?tab=tenants"
"admin?admin_tab=org_config"
"admin?admin_tab=sso"
"admin?admin_tab=notifications"
"admin?admin_tab=billingstats"
"admin?admin_tab=branding(beta)"
)

ALL_ROUTES=("${Routes[@]}")

# Stop frontend container so it test unpushed changes
docker stop shuffle-frontend

# Install all frontend dependencies
yarn install
echo "Starting frontend..."

BROWSER=none yarn start &  
SERVER_PID=$!
echo "Frontend started with PID: $SERVER_PID"

echo "Waiting for 1 minute to ensure the server is fully up..."
sleep 60

echo "Server is up! Starting Selenium tests..."

echo "Starting frontend tests..."
node selenium-test.js "$SERVER_URL" "${ALL_ROUTES[@]}"

TEST_EXIT_CODE=$?

if [[ $TEST_EXIT_CODE -ne 0 ]]; then
echo "Selenium tests failed. Exiting..."
kill $SERVER_PID
exit 1
fi

kill $SERVER_PID
echo "Testing complete. See above logs for errors if any."

# Starting shuffle-frontend container
echo "Starting shuffle-frontend container..."
docker start shuffle-frontend
echo "shuffle-frontend started successfully."
exit 0
