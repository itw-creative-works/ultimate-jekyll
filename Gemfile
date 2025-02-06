source "https://rubygems.org"

# Hello! This is where you manage which Jekyll version is used to run.
# When you want to use a different version, change it below, save the
# file and run `bundle install`. Run Jekyll with `bundle exec`, like so:
#
#     bundle exec jekyll serve
#
# This will help ensure the proper Jekyll version is running.
# Happy Jekylling!
gem "jekyll", "= 4.3.2"

# If you have any plugins, put them here!
group :jekyll_plugins do
  # Master Plugins
  gem "jekyll-paginate-v2", "= 3.0.0"
  gem "jekyll-liquify", "= 0.0.2" # ❌ Version 0.0.3 breaks the site
  gem "jekyll-uj-powertools", "~> 1.0"
  gem "jekyll-truthyfalsy", "~> 1.0"

  # Project Plugins
end

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem "tzinfo-data", platforms: [:mingw, :mswin, :x64_mingw, :jruby]

# Performance-booster for watching directories on Windows
gem "wdm", "~> 0.1.0" if Gem.win_platform?

# Required for Apple silicon
# gem "webrick", "= 1.7.0"

# Fix x86_64 / arm64e error
# /Users/ian/.rbenv/versions/3.0.0/lib/ruby/gems/3.0.0/gems/redcarpet-3.6.0/lib/redcarpet.rb:1:in `require': dlopen(/Users/ian/.rbenv/versions/3.0.0/lib/ruby/gems/3.0.0/gems/redcarpet-3.6.0/lib/redcarpet.bundle, 0x0009): tried: '/Users/ian/.rbenv/versions/3.0.0/lib/ruby/gems/3.0.0/gems/redcarpet-3.6.0/lib/redcarpet.bundle' (mach-o file, but is an incompatible architecture (have (x86_64), need (arm64e))) - /Users/ian/.rbenv/versions/3.0.0/lib/ruby/gems/3.0.0/gems/redcarpet-3.6.0/lib/redcarpet.bundle (LoadError)
gem "redcarpet", "= 3.5.1"
