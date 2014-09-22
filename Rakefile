task(:default).clear
task default: :preview

desc 'install gems by bundler'
task :install do 
  sh 'bundle install --path vendor/bundle'
end

desc 'preview in local'
task :preview do
  sh 'bundle exec jekyll serve --watch'
end
