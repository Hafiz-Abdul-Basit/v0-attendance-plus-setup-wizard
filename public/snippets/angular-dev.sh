# Serve with increased memory allocation
node --max_old_space_size=8192 ./node_modules/@angular/cli/bin/ng serve

# Alternative using npx
npx --node-options="--max_old_space_size=8192" ng serve

# For production build with increased memory
node --max_old_space_size=8192 ./node_modules/@angular/cli/bin/ng build --configuration production
