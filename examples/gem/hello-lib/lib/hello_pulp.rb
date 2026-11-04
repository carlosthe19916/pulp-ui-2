require "rainbow"

module HelloPulp
  def self.greet(name)
    Rainbow("Hello, #{name}!").green
  end
end
