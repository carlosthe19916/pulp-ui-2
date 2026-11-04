Gem::Specification.new do |s|
  s.name = "hello_pulp"
  s.version = ENV.fetch("HELLO_PULP_VERSION", "1.0.0")
  s.summary = "A tiny gem published to Pulp by the RubyGems tutorial"
  s.authors = ["Pulp UI tutorial"]
  s.license = "MIT"
  s.homepage = "https://github.com/carlosthe19916/pulp-ui-2/tree/main/examples/gem"
  s.required_ruby_version = ">= 3.0"
  s.files = ["lib/hello_pulp.rb"]
  s.add_dependency "rainbow", "~> 3.1"
end
