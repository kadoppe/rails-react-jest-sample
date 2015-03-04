require File.expand_path('../boot', __FILE__)

require "active_job/railtie"
require "active_record/railtie"
require "action_controller/railtie"
require "action_mailer/railtie"
require "action_view/railtie"
require "sprockets/railtie"

Bundler.require(*Rails.groups)

module Rex
  class Application < Rails::Application
    config.active_record.raise_in_transactional_callbacks = true

    config.react.variant = :production
    config.react.addons = true

    config.browserify_rails.commandline_options = "--transform reactify --extension=\".jsx\""
  end
end
