Band A: includes tag={"vertical_49"} -> 
"Louvres/slats only" pricing: 
{if(x <= 43)
{
price=0.96;
}
else if(x > 43 && x <= 59)
{
price=1.29;
}
else if(x > 59 && x <= 83)
{
price=1.7;
}
else if(x > 83)
{
price=2.3;
}}

Band B: includes tag={"vertical_40"} -> 
"Louvres/slats only" pricing: 
{if(x <= 43)
{
price=1.29;
}
else if(x > 43 && x <= 59)
{
price=1.59;
}
else if(x > 59 && x <= 83)
{
price=1.89;
}
else if(x > 83)
{
price=2.45;
}}

Band C: includes tag={"vertical_35"} -> 
"Louvres/slats only" pricing: 
{if(x <= 43)
{
price=1.59;
}
else if(x > 43 && x <= 59)
{
price=1.82;
}
else if(x > 59 && x <= 83)
{
price=1.99;
}
else if(x > 83)
{
price=2.6;
}}

Band D: includes tag={"vertical_31","vertical_34"} -> 
"Louvres/slats only" pricing: 
{if(x <= 43)
{
price=1.75;
}
else if(x > 43 && x <= 59)
{
price=1.99;
}
else if(x > 59 && x <= 83)
{
price=2.31;
}
else if(x > 83)
{
price=2.81;
}}

Band E: includes tag={"vertical_25"} -> 
"Louvres/slats only" pricing for inches: 
{if(x <= 43)
{
price=2;
}
else if(x > 43 && x <= 59)
{
price=2.1;
}
else if(x > 59 && x <= 83)
{
price=2.49;
}
else if(x > 83)
{
price=3;
}}

Band F: includes tag={"vertical_18","vertical_22"} -> 
"Louvres/slats only" pricing for inches: 
{if(x <= 59)
{
price=2.7;
}
else if(x > 59 && x < 86.6)
{
price=3.5;
}
else if(x > 86.6 && x < 110)
{
price=4;
}
else if(x > 110 && x < 157)
{
price=4.3;
}}

Band Premium: includes tag={"vertical_16"} -> 
"Louvres/slats only" pricing for inches: 
{if(x <= 43)
{
price=2.49;
}
else if(x > 43 && x <= 59)
{
price=3;
}
else if(x > 59 && x <= 83)
{
price=3.3;
}
else if(x > 83)
{
price=3.7;
}}