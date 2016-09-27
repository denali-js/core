# We have to specify the ignore option here and not in the .babelrc
# because of:
# - https://github.com/babel/babel/issues/4568
# - https://github.com/babel/babel/issues/3789
babel lib \
      --out-dir dist \
      --source-maps \
      --ignore cli/blueprints/*/files/** \
      --watch
