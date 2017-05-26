let ValidateFunctions =
{
  birthDateValidation:function(value)
  {
    let today = new Date();
    return (value.getFullYear() < today.getFullYear() - 13) || (value.getFullYear() > 1980);
  }
}

module.exports = ValidateFunctions;
